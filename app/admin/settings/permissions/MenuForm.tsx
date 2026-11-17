"use client"

import React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  ADMIN_MENU_POSITION_OPTIONS,
  ADMIN_MENU_POSITION_SURFACE,
  type AdminMenuPosition,
  type AdminMenuSurface,
} from "@/assets/enumerate/global"
import { Form, type FormProps } from "@/components/k-view/Form"
import { IconPickerField } from "@/components/k-view/Form/components/IconPickerField"
import { SegmentedControl } from "@/components/k-view/Form/components/SegmentedControl"
import { SelectField } from "@/components/k-view/Form/components/SelectField"
import type { CustomControlProps } from "@/components/k-view/Form/type"
import type { AdminMenuRow, MenuType } from "@/lib/admin/menu-seed"
import { descendantIdsOf, indexByParent } from "@/lib/admin/menu-tree"
import { createMenu, updateMenu } from "@/service/menu"
import { type CreateMenuInput, createMenuSchema } from "@/validators/menu"

const FIELD_LAYOUT: Record<string, string> = {
  position: "sm:col-span-2",
  type: "sm:col-span-2",
  permissionKey: "sm:col-span-2",
}
const MENU_FORM_WATCH_FIELDS = ["type", "position"]

function defaultTypeFor(rows: AdminMenuRow[], parentId: number | null, position: AdminMenuPosition): MenuType {
  if (position !== "ADMIN") return "menu"
  if (parentId === null) return "menu"
  const parent = rows.find((row) => row.id === parentId)
  return parent?.type === "menu" ? "button" : "menu"
}

function getDepths(rows: AdminMenuRow[]) {
  const childrenOf = indexByParent(rows)
  const depths = new Map<number, number>()
  const walk = (parentId: number | null, depth: number) => {
    for (const row of childrenOf.get(parentId) ?? []) {
      if (depths.has(row.id)) continue
      depths.set(row.id, depth)
      walk(row.id, depth + 1)
    }
  }
  walk(null, 0)
  return depths
}

function MenuTypeControl(props: CustomControlProps) {
  const form = useFormContext()
  const position = useWatch({control: form.control, name: "position"}) as AdminMenuPosition | undefined
  const surface: AdminMenuSurface = position ? ADMIN_MENU_POSITION_SURFACE[position] : "ADMIN"
  const options = surface === "BLOG"
    ? [{value: "dir" as const, label: "目录"}, {value: "menu" as const, label: "链接"}]
    : props.options as Array<{ value: MenuType; label: string }>

  function handleChange(next: MenuType) {
    if (next === props.value) return

    const currentKey = String(form.getValues("permissionKey") ?? "")
    if (next === "button") {
      form.setValue("icon", "", {shouldDirty: true})
      form.setValue("path", "", {shouldDirty: true})
      form.setValue("component", "", {shouldDirty: true})
      form.setValue("componentName", "", {shouldDirty: true})
      form.setValue("alwaysShow", false, {shouldDirty: true})
      form.setValue("keepAlive", false, {shouldDirty: true})
      if (!currentKey.startsWith("action:")) form.setValue("permissionKey", "", {shouldDirty: true})
    } else if (next === "dir") {
      form.setValue("component", "", {shouldDirty: true})
      form.setValue("componentName", "", {shouldDirty: true})
      form.setValue("keepAlive", false, {shouldDirty: true})
      form.setValue("permissionKey", "", {shouldDirty: true})
    } else {
      form.setValue("alwaysShow", false, {shouldDirty: true})
      const keyPrefix = surface === "BLOG" ? "blog:" : "page:"
      if (!currentKey.startsWith(keyPrefix)) form.setValue("permissionKey", "", {shouldDirty: true})
    }

    form.clearErrors()
    props.onChange(next)
  }

  return (
    <SegmentedControl
      ariaLabel={props.ariaLabel}
      options={options}
      value={props.value as MenuType}
      onChange={handleChange}
      disabled={props.disabled}
      testIdPrefix={props.testIdPrefix}
    />
  )
}

function MenuPositionControl({
  rows,
  editing,
  ...props
}: CustomControlProps & {rows: AdminMenuRow[]; editing: boolean}) {
  const form = useFormContext()

  function handleChange(value: string) {
    const nextPosition = value as AdminMenuPosition
    if (editing || nextPosition === props.value) return

    const nextSurface = ADMIN_MENU_POSITION_SURFACE[nextPosition]
    const parentId = form.getValues("parentId") as number | null
    const parent = rows.find((row) => row.id === parentId)
    if (parent && parent.position !== nextPosition) {
      form.setValue("parentId", null, {shouldDirty: true})
    }

    form.setValue("surface", nextSurface, {shouldDirty: true})
    form.setValue("path", "", {shouldDirty: true})
    form.setValue("permissionKey", "", {shouldDirty: true})
    if (nextSurface === "BLOG") {
      form.setValue("component", "", {shouldDirty: true})
      form.setValue("componentName", "", {shouldDirty: true})
      form.setValue("alwaysShow", false, {shouldDirty: true})
      form.setValue("keepAlive", false, {shouldDirty: true})
      if (form.getValues("type") === "button") form.setValue("type", "menu", {shouldDirty: true})
    }

    form.clearErrors()
    props.onChange(nextPosition)
  }

  return (
    <SelectField
      {...props}
      value={String(props.value ?? "ADMIN")}
      onChange={handleChange}
      options={ADMIN_MENU_POSITION_OPTIONS}
      disabled={props.disabled || editing}
    />
  )
}

function MenuParentControl({
  rows,
  editing,
  ...props
}: CustomControlProps & {rows: AdminMenuRow[]; editing: AdminMenuRow | null}) {
  const form = useFormContext()
  const position = useWatch({control: form.control, name: "position"}) as AdminMenuPosition | undefined ?? "ADMIN"
  const parentOptions = React.useMemo(() => {
    const positionRows = rows.filter((row) => row.position === position)
    const excluded = editing ? new Set(descendantIdsOf(positionRows, editing.id)) : new Set<number>()
    const depths = getDepths(positionRows)
    return positionRows
      .filter((row) => row.type !== "button" && !row.generatedFromCategory && (position === "ADMIN" || row.type === "dir") && !excluded.has(row.id))
      .map((row) => ({
        value: String(row.id),
        label: `${"　".repeat(depths.get(row.id) ?? 0)}${row.type === "dir" ? "▸ " : "· "}${row.name}`,
      }))
  }, [editing, position, rows])

  return (
    <SelectField
      {...props}
      value={props.value == null ? "root" : String(props.value)}
      onChange={(value: string) => props.onChange(value === "root" ? null : Number(value))}
      options={[{value: "root", label: "顶级菜单"}, ...parentOptions]}
    />
  )
}

function BooleanSegmentControl(props: CustomControlProps) {
  return (
    <SegmentedControl
      ariaLabel={props.ariaLabel}
      options={props.options as Array<{ value: boolean; label: string }>}
      value={Boolean(props.value)}
      onChange={props.onChange}
      disabled={props.disabled}
      testIdPrefix={props.testIdPrefix}
    />
  )
}

export type MenuFormProps = {
  editing: AdminMenuRow | null
  defaultParentId: number | null
  defaultPosition: AdminMenuPosition
  rows: AdminMenuRow[]
  onCancel: () => void
  onSuccess: (position: AdminMenuPosition) => void
}

export function MenuForm({ editing, defaultParentId, defaultPosition, rows, onCancel, onSuccess }: MenuFormProps) {
  const [saving, setSaving] = React.useState(false)

  const formComponents = React.useMemo<FormProps["formComponents"]>(() => ({
    menuParent: (props) => <MenuParentControl {...props} rows={rows} editing={editing} />,
    menuPosition: (props) => <MenuPositionControl {...props} rows={rows} editing={Boolean(editing)} />,
    menuType: (props) => <MenuTypeControl {...props} />,
    iconPicker: (props) => (
      <IconPickerField
        id={props.id}
        value={typeof props.value === "string" ? props.value : ""}
        onChange={props.onChange}
        disabled={props.disabled}
        options={props.options as readonly string[]}
        placeholder={props.placeholder}
        ariaLabel={props.ariaLabel}
        emptyLabel={props.emptyLabel}
        columns={props.columns}
      />
    ),
    booleanSegment: (props) => <BooleanSegmentControl {...props} />,
  }), [editing, rows])

  const defaultValues: CreateMenuInput = {
    surface: editing?.surface ?? ADMIN_MENU_POSITION_SURFACE[defaultPosition],
    position: editing?.position ?? defaultPosition,
    parentId: editing?.parentId ?? defaultParentId,
    name: editing?.name ?? "",
    type: editing?.type ?? defaultTypeFor(rows, defaultParentId, defaultPosition),
    icon: editing?.icon ?? "",
    path: editing?.path ?? "",
    component: editing?.component ?? "",
    componentName: editing?.componentName ?? "",
    permissionKey: editing?.permissionKey ?? "",
    sort: editing?.sort ?? 0,
    status: editing?.status === 0 ? 0 : 1,
    visible: editing?.visible ?? true,
    alwaysShow: editing?.alwaysShow ?? false,
    keepAlive: editing?.keepAlive ?? false,
  }

  async function handleSubmit(values: Record<string, unknown>) {
    if (saving) return
    const input = values as CreateMenuInput
    const position = input.position
    const payload = {
      surface: ADMIN_MENU_POSITION_SURFACE[position],
      position,
      parentId: input.parentId ?? null,
      name: input.name.trim(),
      type: input.type,
      icon: input.type === "button" ? null : input.icon?.trim() || null,
      path: input.type === "button" ? null : input.path?.trim() || null,
      component: input.type === "menu" ? input.component?.trim() || null : null,
      componentName: input.type === "menu" ? input.componentName?.trim() || null : null,
      permissionKey: input.type === "dir" ? null : input.permissionKey?.trim() || null,
      sort: input.sort,
      status: input.status === 0 ? 0 : 1,
      visible: input.visible,
      alwaysShow: input.type === "dir" ? input.alwaysShow : false,
      keepAlive: input.type === "menu" ? input.keepAlive : false,
    }

    setSaving(true)
    try {
      const result = editing
        ? await updateMenu({id: editing.id, ...payload})
        : await createMenu(payload)

      if (result.code !== 200) {
        toast.error(result.message || "保存失败")
        return
      }

      toast.success(result.message || (editing ? "菜单已更新" : "菜单已创建"))
      onSuccess(position)
    } catch {
      toast.error("保存失败，请稍后再试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form
      schema={createMenuSchema}
      defaultValues={defaultValues}
      formComponents={formComponents}
      onSubmit={handleSubmit}
      withSubmit={false}
      watchFields={MENU_FORM_WATCH_FIELDS}
      fieldHidden={(name, values) => {
        const type = values.type as MenuType
        const currentPosition = values.position as AdminMenuPosition
        const currentSurface = ADMIN_MENU_POSITION_SURFACE[currentPosition]
        if (name === "surface") return true
        if (currentSurface === "BLOG" && (name === "component" || name === "componentName" || name === "alwaysShow" || name === "keepAlive")) return true
        if (name === "icon") return type === "button"
        if (name === "path") return type === "button"
        if (name === "permissionKey") return type === "dir"
        if (name === "component" || name === "componentName") return type !== "menu"
        if (name === "alwaysShow") return type !== "dir"
        if (name === "keepAlive") return type !== "menu"
        return false
      }}
      fieldHiddenClassName="hidden"
      fieldDisabled={(name) => name === "position" && Boolean(editing)}
      fieldClassName={(name) => FIELD_LAYOUT[name]}
      fieldsClassName="grid max-h-[min(70vh,calc(100dvh-10rem))] grid-cols-1 gap-x-4 gap-y-3 overflow-y-auto px-4 py-4 sm:grid-cols-2 sm:px-5"
      className="flex min-w-0 flex-col space-y-0 px-0"
    >
      <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--adm-line)] px-5 py-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          取消
        </Button>
        <Button type="submit" className="admin-dialog-submit" disabled={saving}>
          {saving ? "保存中…" : "确定"}
        </Button>
      </div>
    </Form>
  )
}
