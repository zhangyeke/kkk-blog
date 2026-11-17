"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { FilePlus2, Layers3, Pencil, Plus, RotateCcw, Save, Settings2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AdminIcon } from "@/app/admin/components/admin-icons"
import { usePermission } from "@/components/admin/permission-context"
import { Form, type FormFieldConfig } from "@/components/k-view/Form"
import { RegionCascaderField } from "@/components/k-view/Form/components/RegionCascader"
import type { CustomControlProps } from "@/components/k-view/Form/type"
import { Dialog } from "@/components/k-view/Popup/Dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/ui/cn"
import { ADMIN_ICON_NAMES } from "@/assets/enumerate/global"
import type { AdminSettingFieldType } from "@/assets/enumerate/global"
import {
  createAdminSettingField,
  createAdminSettingGroup,
  deleteAdminSettingField,
  deleteAdminSettingGroup,
  restoreAdminBrandingGroup,
  saveAdminSettingValues,
  updateAdminSettingField,
  updateAdminSettingGroup,
} from "@/service/admin-settings"
import type { AdminSettingFieldView, AdminSettingGroupView } from "@/lib/admin/settings-store"

type SettingsWorkbenchProps = { groups: AdminSettingGroupView[] }
type FieldValues = Record<string, unknown>
type GroupEditor = { mode: "create" } | { mode: "edit"; group: AdminSettingGroupView }
type FieldEditor =
  | { mode: "create"; groupKey: string }
  | { mode: "edit"; groupKey: string; field: AdminSettingFieldView }
type DeleteTarget = { kind: "group"; group: AdminSettingGroupView } | { kind: "field"; field: AdminSettingFieldView }

const CONTROL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "单行文本", value: "string" },
  { label: "下拉选择", value: "select" },
  { label: "数字", value: "number" },
  { label: "多行文本", value: "textarea" },
  { label: "文件列表", value: "uploadFiles" },
  { label: "图片上传", value: "imageUpload" },
  { label: "Markdown", value: "markdown" },
  { label: "地区选择", value: "regionCascader" },
  { label: "后台图标", value: "iconPicker" },
  { label: "状态选项", value: "statusSegment" },
]

const BOOLEAN_OPTIONS = [
  { label: "选填", value: "false" },
  { label: "必填", value: "true" },
]

function configField(
  key: string,
  type: string,
  label: string,
  inputProps: Record<string, unknown> = {},
  required = false
): FormFieldConfig {
  return {
    key,
    type,
    required,
    fieldConfig: { label, inputProps },
    options: [],
    schema: [],
  } as FormFieldConfig
}

const GROUP_CREATE_FIELDS: FormFieldConfig[] = [
  configField("name", "string", "分组名称", { placeholder: "例如：内容展示", className: "admin-dialog-input" }, true),
  configField(
    "key",
    "string",
    "分组标识",
    { placeholder: "例如：content_display", autoComplete: "off", className: "admin-dialog-input" },
    true
  ),
  configField("description", "textarea", "说明", {
    placeholder: "简单说明这个分组用途",
    className: "admin-dialog-input min-h-20",
  }),
]

const GROUP_EDIT_FIELDS = GROUP_CREATE_FIELDS.filter((field) => field.key !== "key")

const FIELD_CREATE_FIELDS: FormFieldConfig[] = [
  configField("label", "string", "字段名称", { placeholder: "例如：页脚说明", className: "admin-dialog-input" }, true),
  configField(
    "key",
    "string",
    "字段标识",
    { placeholder: "例如：footer_note", autoComplete: "off", className: "admin-dialog-input" },
    true
  ),
  configField(
    "type",
    "select",
    "控件类型",
    { placeholder: "选择控件类型", options: CONTROL_OPTIONS, className: "admin-dialog-input" },
    true
  ),
  configField("required", "select", "是否必填", { options: BOOLEAN_OPTIONS, className: "admin-dialog-input" }),
  configField("placeholder", "string", "占位提示", {
    placeholder: "输入控件提示文字",
    className: "admin-dialog-input",
  }),
  configField("description", "textarea", "字段说明", {
    placeholder: "在字段下方展示的说明",
    className: "admin-dialog-input min-h-20",
  }),
  configField("optionsText", "textarea", "选项（每行一项，格式：值|名称）", {
    placeholder: "例如：\nsmall|小\nlarge|大\n仅下拉选择和状态选项需要填写",
    className: "admin-dialog-input min-h-24",
  }),
]

const FIELD_EDIT_FIELDS = FIELD_CREATE_FIELDS.filter((field) => field.key !== "key")

const REGION_FORM_COMPONENTS = {
  regionCascader: (props: CustomControlProps) => (
    <RegionCascaderField
      {...props}
      getOptionValue={(option: { id: string }) => option.id}
      getOptionLabel={(option: { name: string }) => option.name}
    />
  ),
}

function initialValue(field: AdminSettingFieldView): unknown {
  if (field.value !== null) return field.value
  if (field.type === "regionCascader" || field.type === "uploadFiles") return []
  if (field.type === "number") return undefined
  if (field.type === "select" || field.type === "statusSegment") return field.config.options?.[0]?.value ?? ""
  return ""
}

function formFieldsForGroup(group: AdminSettingGroupView): FormFieldConfig[] {
  return group.fields.map((field) => {
    const inputProps: Record<string, unknown> = {
      placeholder: field.config.placeholder,
      className: "admin-dialog-input w-full text-sm md:text-base",
      "aria-label": field.label,
    }
    if (field.type === "select") inputProps.options = field.config.options ?? []
    if (field.type === "statusSegment") {
      inputProps.options = field.config.options ?? []
      inputProps.ariaLabel = field.label
    }
    if (field.type === "iconPicker") {
      inputProps.options = ADMIN_ICON_NAMES
      inputProps.placeholder = "选择图标"
      inputProps.ariaLabel = `选择${field.label}`
      inputProps.emptyLabel = "无"
      inputProps.columns = 5
    }
    return {
      key: field.key,
      type: field.type,
      required: field.required,
      fieldConfig: {
        label: field.label,
        description: field.description ?? undefined,
        inputProps,
      },
      options: [],
      schema: [],
    } as FormFieldConfig
  })
}

function defaultValuesForGroup(group: AdminSettingGroupView): FieldValues {
  return Object.fromEntries(group.fields.map((field) => [field.key, initialValue(field)]))
}

function optionsTextForField(field?: AdminSettingFieldView): string {
  return (field?.config.options ?? []).map((option) => `${option.value}|${option.label}`).join("\n")
}

function parseOptionsText(value: unknown): Array<{ value: string; label: string }> {
  if (typeof value !== "string") return []
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|")
      if (separator < 0) return { value: line, label: line }
      return { value: line.slice(0, separator).trim(), label: line.slice(separator + 1).trim() }
    })
    .filter((option) => option.value && option.label)
}

function surfaceStyle(): React.CSSProperties {
  return { borderColor: "var(--adm-line)", background: "var(--adm-paper-2)" }
}

export function SettingsWorkbench({ groups }: SettingsWorkbenchProps) {
  const router = useRouter()
  const { can } = usePermission()
  const canUpdate = can("action:settings:update")
  const [activeKey, setActiveKey] = React.useState("branding")
  const [groupEditor, setGroupEditor] = React.useState<GroupEditor | null>(null)
  const [fieldEditor, setFieldEditor] = React.useState<FieldEditor | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [generatedGroupKey, setGeneratedGroupKey] = React.useState("")

  const activeGroup = groups.find((group) => group.key === activeKey) ?? groups[0]
  React.useEffect(() => {
    if (!groups.some((group) => group.key === activeKey)) setActiveKey(groups[0]?.key ?? "branding")
  }, [activeKey, groups])

  const runAction = React.useCallback(
    async (action: () => Promise<{ code: number; message?: string }>, fallback: string) => {
      setSaving(true)
      try {
        const result = await action()
        if (result.code !== 200) {
          toast.error(result.message || fallback)
          return false
        }
        toast.success(result.message || "设置已更新")
        router.refresh()
        return true
      } catch {
        toast.error(fallback)
        return false
      } finally {
        setSaving(false)
      }
    },
    [router]
  )

  const handleSaveValues = React.useCallback(
    async (values: FieldValues) => {
      if (!activeGroup) return
      await runAction(() => saveAdminSettingValues({ groupKey: activeGroup.key, values }), "保存设置失败，请稍后重试")
    },
    [activeGroup, runAction]
  )

  const handleSaveGroup = React.useCallback(
    async (values: FieldValues) => {
      if (!groupEditor) return
      const isCreate = groupEditor.mode === "create"
      const payload = isCreate
        ? { name: values.name, key: values.key, description: values.description }
        : { id: groupEditor.group.id, name: values.name, description: values.description }
      const ok = await runAction(
        () => (isCreate ? createAdminSettingGroup(payload) : updateAdminSettingGroup(payload)),
        isCreate ? "创建配置分组失败" : "更新配置分组失败"
      )
      if (ok) {
        if (isCreate) setActiveKey(String(values.key))
        setGroupEditor(null)
      }
    },
    [groupEditor, runAction]
  )

  const handleSaveField = React.useCallback(
    async (values: FieldValues) => {
      if (!fieldEditor) return
      const isCreate = fieldEditor.mode === "create"
      const type = String(values.type) as AdminSettingFieldType
      if (
        !isCreate &&
        type !== fieldEditor.field.type &&
        !window.confirm("更改控件类型会清空此项已保存的值，仍要继续吗？")
      )
        return
      const options = type === "select" || type === "statusSegment" ? parseOptionsText(values.optionsText) : undefined
      const config = {
        ...(typeof values.placeholder === "string" && values.placeholder.trim()
          ? { placeholder: values.placeholder.trim() }
          : {}),
        ...(options ? { options } : {}),
      }
      const payload = isCreate
        ? {
            groupKey: fieldEditor.groupKey,
            key: values.key,
            label: values.label,
            type,
            required: values.required === "true",
            description: values.description,
            config,
          }
        : {
            id: fieldEditor.field.id,
            label: values.label,
            type,
            required: values.required === "true",
            description: values.description,
            config,
          }
      const ok = await runAction(
        () => (isCreate ? createAdminSettingField(payload) : updateAdminSettingField(payload)),
        isCreate ? "添加配置项失败" : "更新配置项失败"
      )
      if (ok) setFieldEditor(null)
    },
    [fieldEditor, runAction]
  )

  const handleDelete = React.useCallback(async () => {
    if (!deleteTarget) return
    const isGroup = deleteTarget.kind === "group"
    const target = deleteTarget
    const ok = await runAction(
      () =>
        target.kind === "group"
          ? deleteAdminSettingGroup({ id: target.group.id })
          : deleteAdminSettingField({ id: target.field.id }),
      isGroup ? "删除分组失败" : "删除配置项失败"
    )
    if (ok) {
      if (target.kind === "group" && activeKey === target.group.key) {
        setActiveKey(groups.find((group) => group.key !== target.group.key)?.key ?? "")
      }
      setDeleteTarget(null)
    }
  }, [activeKey, deleteTarget, groups, runAction])

  const openCreateGroup = React.useCallback(() => {
    const suffix = globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 8) ?? Date.now().toString(36)
    setGeneratedGroupKey(`custom_${suffix}`)
    setGroupEditor({ mode: "create" })
  }, [])

  const handleRestoreBranding = React.useCallback(async () => {
    const ok = await runAction(restoreAdminBrandingGroup, "恢复后台品牌配置失败")
    if (ok) setActiveKey("branding")
  }, [runAction])

  const valueFields = activeGroup ? formFieldsForGroup(activeGroup) : []
  const groupDefaults = activeGroup ? defaultValuesForGroup(activeGroup) : {}
  const hasBrandingGroup = groups.some((group) => group.key === "branding")
  const groupEditorIsCreate = groupEditor?.mode === "create"
  const groupEditorGroup = groupEditor?.mode === "edit" ? groupEditor.group : null
  const fieldEditorIsCreate = fieldEditor?.mode === "create"
  const fieldEditorField = fieldEditor?.mode === "edit" ? fieldEditor.field : undefined

  const groupDialogFields = groupEditorIsCreate ? GROUP_CREATE_FIELDS : GROUP_EDIT_FIELDS
  const groupDialogValues = groupEditorIsCreate
    ? { name: "", key: generatedGroupKey, description: "" }
    : { name: groupEditorGroup?.name ?? "", description: groupEditorGroup?.description ?? "" }

  const fieldDialogFields = fieldEditorIsCreate ? FIELD_CREATE_FIELDS : FIELD_EDIT_FIELDS
  const fieldDialogValues = fieldEditorIsCreate
    ? { label: "", key: "", type: "string", required: "false", placeholder: "", description: "", optionsText: "" }
    : {
        label: fieldEditorField?.label ?? "",
        type: fieldEditorField?.type ?? "string",
        required: fieldEditorField?.required ? "true" : "false",
        placeholder: fieldEditorField?.config.placeholder ?? "",
        description: fieldEditorField?.description ?? "",
        optionsText: optionsTextForField(fieldEditorField),
      }

  return (
    <div className="mx-auto w-full max-w-[1600px] pb-6">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-xl border p-3 lg:sticky lg:top-4 lg:self-start" style={surfaceStyle()}>
          <div className="mb-2 flex items-center justify-between px-1">
            <div
              className="flex items-center gap-2 text-sm font-medium md:text-base"
              style={{ color: "var(--adm-ink)" }}
            >
              <Layers3 className="size-4" /> 配置分组
            </div>
            {canUpdate && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="新增配置分组"
                title="新增配置分组"
                onClick={openCreateGroup}
              >
                <Plus className="size-4" />
              </Button>
            )}
          </div>
          <nav
            aria-label="设置分组"
            className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {groups.map((group) => {
              const selected = group.key === activeGroup?.key
              return (
                <div
                  key={group.key}
                  className={cn(
                    "group flex shrink-0 items-center gap-1 rounded-lg",
                    selected && "bg-[var(--adm-paper-3)]"
                  )}
                >
                  <button
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setActiveKey(group.key)}
                    className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-[var(--adm-paper-3)] md:text-base"
                    style={{ color: selected ? "var(--adm-ink)" : "var(--adm-ink-2)" }}
                  >
                    {group.isBuiltin ? (
                      <Settings2 className="size-4 shrink-0" />
                    ) : (
                      <Layers3 className="size-4 shrink-0" />
                    )}
                    <span className="max-w-40 truncate">{group.name}</span>
                  </button>
                  {canUpdate && group.id > 0 && (!group.isBuiltin || group.key === "branding") && (
                    <div className="flex shrink-0 pr-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`编辑${group.name}`}
                        title={`编辑${group.name}`}
                        onClick={() => setGroupEditor({ mode: "edit", group })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive size-7"
                        aria-label={`删除${group.name}`}
                        title={`删除${group.name}`}
                        onClick={() => setDeleteTarget({ kind: "group", group })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          {canUpdate && !hasBrandingGroup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              disabled={saving}
              onClick={() => void handleRestoreBranding()}
            >
              <RotateCcw className="size-4" /> 恢复后台品牌
            </Button>
          )}
          <p
            className="mt-3 hidden border-t px-1 pt-3 text-xs leading-relaxed lg:block"
            style={{ borderColor: "var(--adm-line-2)", color: "var(--adm-ink-3)" }}
          >
            自定义分组适合保存可复用的后台配置。接入业务功能后即可读取这些值。
          </p>
        </aside>

        {activeGroup ? (
        <section className="min-w-0 overflow-hidden rounded-xl border" style={surfaceStyle()}>
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-6"
            style={{ borderColor: "var(--adm-line-2)" }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="adm-serif truncate text-lg md:text-xl" style={{ color: "var(--adm-ink)" }}>
                  {activeGroup.name}
                </h2>
                {activeGroup.isBuiltin && (
                  <span
                    className="rounded-full border px-2 py-0.5 text-xs"
                    style={{ borderColor: "var(--adm-line)", color: "var(--adm-ink-3)" }}
                  >
                    系统
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm md:text-base" style={{ color: "var(--adm-ink-3)" }}>
                {activeGroup.description || "配置此分组中的后台数据。"}
              </p>
            </div>
            {canUpdate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setFieldEditor({ mode: "create", groupKey: activeGroup.key })}
              >
                <FilePlus2 className="size-4" /> 添加表单项
              </Button>
            )}
          </div>

          <div className="space-y-6 p-4 md:p-6">
            {activeGroup.fields.length > 0 ? (
              <Form
                key={`${activeGroup.key}-${activeGroup.fields.map((field) => field.id).join("_")}`}
                fields={valueFields}
                defaultValues={groupDefaults}
                formComponents={REGION_FORM_COMPONENTS}
                withSubmit={false}
                onSubmit={handleSaveValues}
                className="space-y-5 px-0"
                fieldsClassName="grid min-w-0 gap-5 sm:grid-cols-2"
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
                  style={{ borderColor: "var(--adm-line-2)" }}
                >
                  <p className="text-sm" style={{ color: "var(--adm-ink-3)" }}>
                    保存后会立即应用到后台界面。
                  </p>
                  {canUpdate && (
                    <Button type="submit" disabled={saving} className="adm-action">
                      <Save className="size-4" />
                      {saving ? "保存中…" : "保存设置"}
                    </Button>
                  )}
                </div>
              </Form>
            ) : (
              <div
                className="rounded-xl border border-dashed px-4 py-10 text-center"
                style={{ borderColor: "var(--adm-line)", color: "var(--adm-ink-3)" }}
              >
                <Layers3 className="mx-auto mb-2 size-6 opacity-70" />
                <p className="text-sm md:text-base">这个分组还没有表单项</p>
                <p className="mt-1 text-xs md:text-sm">添加字段后，就可以在这里编辑和保存配置值。</p>
              </div>
            )}

            <section className="border-t pt-5" style={{ borderColor: "var(--adm-line-2)" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium md:text-lg" style={{ color: "var(--adm-ink)" }}>
                    表单项管理
                  </h3>
                  <p className="mt-0.5 text-xs md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
                    字段标识创建后保持稳定；修改控件类型会清空该项当前值。
                  </p>
                </div>
              </div>
              {activeGroup.fields.length === 0 ? (
                <p
                  className="rounded-lg border border-dashed px-3 py-4 text-sm"
                  style={{ borderColor: "var(--adm-line)", color: "var(--adm-ink-3)" }}
                >
                  暂无字段定义
                </p>
              ) : (
                <div className="divide-y rounded-lg border" style={{ borderColor: "var(--adm-line)" }}>
                  {activeGroup.fields.map((field) => (
                    <div key={field.id} className="flex min-w-0 items-center gap-3 px-3 py-3 md:px-4">
                      <div
                        className="grid size-9 shrink-0 place-items-center rounded-lg"
                        style={{ background: "var(--adm-paper-3)", color: "var(--adm-c1)" }}
                      >
                        {field.type === "iconPicker" ? (
                          <AdminIcon name="book" className="size-4" />
                        ) : (
                          <Settings2 className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span
                            className="truncate text-sm font-medium md:text-base"
                            style={{ color: "var(--adm-ink)" }}
                          >
                            {field.label}
                          </span>
                          {field.required && (
                            <span className="text-xs" style={{ color: "var(--adm-c2)" }}>
                              必填
                            </span>
                          )}
                        </div>
                        <div
                          className="mt-0.5 flex flex-wrap gap-x-2 text-xs md:text-sm"
                          style={{ color: "var(--adm-ink-3)" }}
                        >
                          <code>{field.key}</code>
                          <span>·</span>
                          <span>
                            {CONTROL_OPTIONS.find((option) => option.value === field.type)?.label ?? field.type}
                          </span>
                          {field.isBuiltin && (
                            <>
                              <span>·</span>
                              <span>系统字段</span>
                            </>
                          )}
                        </div>
                      </div>
                      {canUpdate && !field.isBuiltin && (
                        <div className="flex shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`编辑${field.label}`}
                            onClick={() => setFieldEditor({ mode: "edit", groupKey: activeGroup.key, field })}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive size-8"
                            aria-label={`删除${field.label}`}
                            onClick={() => setDeleteTarget({ kind: "field", field })}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
        ) : (
          <section className="flex min-h-72 min-w-0 flex-col items-center justify-center rounded-xl border p-6 text-center" style={surfaceStyle()}>
            <Layers3 className="mb-3 size-8" style={{ color: "var(--adm-ink-3)" }} />
            <h2 className="text-base font-medium md:text-lg" style={{ color: "var(--adm-ink)" }}>暂无配置分组</h2>
            <p className="mt-1 max-w-md text-sm" style={{ color: "var(--adm-ink-3)" }}>
              新建分组以保存自定义配置，或恢复后台品牌配置。
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {canUpdate && (
                <Button type="button" onClick={openCreateGroup} className="adm-action">
                  <Plus className="size-4" /> 新增配置分组
                </Button>
              )}
              {canUpdate && !hasBrandingGroup && (
                <Button type="button" variant="outline" disabled={saving} onClick={() => void handleRestoreBranding()}>
                  <RotateCcw className="size-4" /> 恢复后台品牌
                </Button>
              )}
            </div>
          </section>
        )}
      </div>

      <Dialog
        open={groupEditor !== null}
        onOpenChange={(open) => !open && setGroupEditor(null)}
        title={groupEditorIsCreate ? "新增配置分组" : "编辑配置分组"}
        description="分组标识用于后续通过服务读取配置，创建后不可修改。"
        footer={null}
        contentClassName="admin-shell max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-xl p-0"
      >
        {groupEditor && (
          <Form
            key={`${groupEditor.mode}-${groupEditorGroup?.id ?? "new"}`}
            fields={groupDialogFields}
            defaultValues={groupDialogValues}
            withSubmit={false}
            onSubmit={handleSaveGroup}
            className="px-5 py-5 md:px-6"
            fieldsClassName="space-y-4"
          >
            <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--adm-line-2)" }}>
              <Button type="button" variant="outline" onClick={() => setGroupEditor(null)}>
                取消
              </Button>
              <Button type="submit" disabled={saving} className="adm-action">
                {saving ? "保存中…" : "保存分组"}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>

      <Dialog
        open={fieldEditor !== null}
        onOpenChange={(open) => !open && setFieldEditor(null)}
        title={fieldEditorIsCreate ? "新增表单项" : "编辑表单项"}
        description="下拉和状态控件的选项按“值|名称”逐行填写。"
        footer={null}
        contentClassName="admin-shell max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-xl p-0"
      >
        {fieldEditor && (
          <Form
            key={`${fieldEditor.mode}-${fieldEditorField?.id ?? fieldEditor.groupKey}`}
            fields={fieldDialogFields}
            defaultValues={fieldDialogValues}
            withSubmit={false}
            onSubmit={handleSaveField}
            className="px-5 py-5 md:px-6"
            fieldsClassName="grid gap-4 sm:grid-cols-2"
          >
            {fieldEditorIsCreate && (
              <p className="text-xs sm:col-span-2" style={{ color: "var(--adm-ink-3)" }}>
                字段标识使用英文字母开头，只能包含字母、数字、下划线和短横线。
              </p>
            )}
            <div
              className="flex justify-end gap-2 border-t pt-4 sm:col-span-2"
              style={{ borderColor: "var(--adm-line-2)" }}
            >
              <Button type="button" variant="outline" onClick={() => setFieldEditor(null)}>
                取消
              </Button>
              <Button type="submit" disabled={saving} className="adm-action">
                {saving ? "保存中…" : fieldEditorIsCreate ? "添加字段" : "保存字段"}
              </Button>
            </div>
          </Form>
        )}
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={deleteTarget?.kind === "group" ? "删除配置分组？" : "删除表单项？"}
        description={
          deleteTarget?.kind === "group"
            ? deleteTarget.group.key === "branding"
              ? "删除后台品牌配置会级联清除品牌字段和值，后台将回退默认品牌。之后可在此页恢复品牌配置。此操作无法撤销。"
              : `删除“${deleteTarget.group.name}”会同时删除其中 ${deleteTarget.group.fields.length} 个配置项及其已保存值。此操作无法撤销。`
            : `删除“${
                deleteTarget?.kind === "field" ? deleteTarget.field.label : ""
              }”会同时删除该字段定义及其已保存值。此操作无法撤销。`
        }
        footer={null}
        contentClassName="admin-shell w-[min(30rem,calc(100vw-2rem))] rounded-xl p-0"
      >
        <div className="flex justify-end gap-2 px-5 py-5 md:px-6">
          <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
            取消
          </Button>
          <Button type="button" variant="destructive" disabled={saving} onClick={() => void handleDelete()}>
            <Trash2 className="size-4" />
            {saving ? "删除中…" : "确认删除"}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
