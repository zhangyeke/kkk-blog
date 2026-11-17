"use client"

import React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronRight, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AdminIcon } from "@/app/admin/components/admin-icons"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { usePermission } from "@/components/admin/permission-context"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/k-view/Empty"
import { Tag } from "@/components/k-view/Tag"
import { DataTable, type DataTableColumn } from "@/components/k-view/DataTable"
import { type FilterField, FilterForm } from "@/components/k-view/FilterForm"
import { Dialog as PopupDialog } from "@/components/k-view/Popup/Dialog"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { TableToolbar } from "@/app/admin/components/TableToolbar"
import { ToolbarActionButton } from "@/app/admin/components/ToolbarActionButton"
import { Switch } from "@/components/ui/switch"
import {
  ADMIN_MENU_POSITION_OPTIONS,
  ADMIN_MENU_POSITION_SURFACE,
  ADMIN_STATUS_FILTERS,
  type AdminMenuPosition,
  type AdminMenuSurface,
  type AdminStatusFilter,
} from "@/assets/enumerate/global"
import type { AdminMenuRow } from "@/lib/admin/menu-seed"
import { indexByParent } from "@/lib/admin/menu-tree"
import { cn } from "@/lib/ui/cn"
import { deleteMenu, refreshMenuCache, toggleMenuStatus } from "@/service/menu"
import { MenuForm } from "./MenuForm"

/**
 * 菜单管理（树形表格）。
 *
 * ── 布局是硬约束 ──
 * 筛选区和工具条保持 shrink-0，通用 DataTable 填满剩余空间并负责表格滚动，
 * 树形列、状态开关和行操作通过自定义列渲染。
 *
 * ── 数据流是单向的 ──
 * 服务端下发扁平行 + 授权计数 → 组件本地建树、本地筛选、本地展开态
 * → 任何写操作调 server action → router.refresh() 拿新快照。
 * 组件里不维护「菜单副本」，避免刷新后本地状态和服务端打架。
 */

export type MenuManagerProps = {
  rows: AdminMenuRow[]
  /** permissionKey → 被授权的角色数 */
  grantCounts: Record<string, number>
  /** 当前用户拥有的权限 key（页面级 + 动作级），与 usePermission 同源，做双保险 */
  allowed: string[]
}

/** 一行可见节点：行 + 树深度 + 是否可展开 */
type VisibleRow = {
  row: AdminMenuRow
  depth: number
  expandable: boolean
}

/** 每层缩进 20px，第三层及更深都按 40px 处理（再深就看不出层级了） */
function indentOf(depth: number): number {
  return Math.min(depth, 2) * 20
}

/** 建索引：父 → 子（已排序）、可展开节点 */
function buildIndex(rows: AdminMenuRow[]): {
  childrenOf: Map<number | null, AdminMenuRow[]>
  expandableIds: number[]
} {
  // 父行缺失（脏数据）由 indexByParent 归到根节点，宁可多显示也不要静默丢行
  const childrenOf = indexByParent(rows)

  const expandableIds = rows
    .filter((row) => row.type !== "button" && (childrenOf.get(row.id)?.length ?? 0) > 0)
    .map((row) => row.id)

  return { childrenOf, expandableIds }
}

const MENU_FILTER_FIELDS: FilterField[] = [
  {
    key: "keyword",
    type: "string",
    required: false,
    fieldConfig: {
      label: "菜单名称",
      inputProps: {
        placeholder: "搜索菜单…",
        className: "h-8 w-full text-sm md:text-base sm:w-[180px]",
        autoComplete: "off",
        "aria-label": "菜单名称",
      },
    },
    options: [],
    schema: [],
  },
  {
    key: "status",
    type: "select",
    required: false,
    fieldConfig: {
      label: "状态",
      fieldType: "select",
      inputProps: {
        placeholder: "全部状态",
        options: [
          { label: "正常", value: "1" },
          { label: "停用", value: "0" },
        ],
        className: "h-8 w-full text-sm md:text-base sm:w-[132px]",
        style: {
          borderColor: "var(--adm-line)",
          color: "var(--adm-ink)",
          background: "var(--adm-paper-2)",
        },
        "aria-label": "状态",
      },
    },
    options: [],
    schema: [],
  },
]

export function MenuManager({ rows, grantCounts, allowed }: MenuManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { preset } = useAdminTheme()
  const { openDialog } = useRenderDialog()
  const { can } = usePermission()
  const keyword = searchParams.get("keyword") ?? ""
  const requestedStatus = searchParams.get("status")
  const statusFilter: AdminStatusFilter = ADMIN_STATUS_FILTERS.includes(requestedStatus as AdminStatusFilter)
    ? (requestedStatus as AdminStatusFilter)
    : "all"

  // allowed 来自本页服务端计算，can 来自 layout 注入；两者同源，任一命中即放行
  const allowedSet = React.useMemo(() => new Set(allowed), [allowed])
  const canDo = React.useCallback((key: string) => allowedSet.has(key) || can(key), [allowedSet, can])
  const canCreate = canDo("action:menu:create")
  const canUpdate = canDo("action:menu:update")
  const canDelete = canDo("action:menu:delete")

  const [surface, setSurface] = React.useState<AdminMenuSurface>("ADMIN")
  const surfaceRows = React.useMemo(() => rows.filter((row) => row.surface === surface), [rows, surface])
  const { childrenOf, expandableIds } = React.useMemo(() => buildIndex(surfaceRows), [surfaceRows])

  const [collapsed, setCollapsed] = React.useState<ReadonlySet<number>>(() => new Set<number>())
  const [pendingId, setPendingId] = React.useState<number | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)
  const [confirmRow, setConfirmRow] = React.useState<AdminMenuRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const filtering = keyword.trim() !== "" || statusFilter !== "all"
  const wasFiltering = React.useRef(false)

  React.useEffect(() => {
    if (wasFiltering.current && !filtering) setCollapsed(new Set<number>())
    wasFiltering.current = filtering
  }, [filtering])

  /* ---------------- 筛选 + 展开态 → 可见行 ---------------- */
  const visibleRows = React.useMemo<VisibleRow[]>(() => {
    const needle = keyword.trim().toLowerCase()
    const keep = new Set<number>()
    const byId = new Map(surfaceRows.map((row) => [row.id, row]))

    for (const row of surfaceRows) {
      const nameHit = needle === "" || row.name.toLowerCase().includes(needle)
      const statusHit = statusFilter === "all" || String(row.status) === statusFilter
      if (!nameHit || !statusHit) continue

      // 命中即保留整条父链，否则子项会被过滤掉的父级藏起来
      keep.add(row.id)
      let cursor = row.parentId
      while (cursor != null && !keep.has(cursor)) {
        keep.add(cursor)
        cursor = byId.get(cursor)?.parentId ?? null
      }
    }

    // 筛选时强制展开：否则「搜到了但父级是折叠的」等于没搜到
    const effectiveCollapsed: ReadonlySet<number> = filtering ? new Set<number>() : collapsed

    const out: VisibleRow[] = []
    const walk = (parentId: number | null, depth: number): void => {
      for (const row of childrenOf.get(parentId) ?? []) {
        if (!keep.has(row.id)) continue
        const children = (childrenOf.get(row.id) ?? []).filter((child) => keep.has(child.id))
        const expandable = row.type !== "button" && children.length > 0
        out.push({ row, depth, expandable })
        if (!expandable || effectiveCollapsed.has(row.id)) continue
        walk(row.id, depth + 1)
      }
    }
    walk(null, 0)
    return out
  }, [surfaceRows, childrenOf, keyword, statusFilter, collapsed, filtering])

  /* ---------------- 交互 ---------------- */
  const toggleCollapse = React.useCallback((id: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = React.useCallback(() => {
    setCollapsed((prev) => (prev.size > 0 ? new Set<number>() : new Set<number>(expandableIds)))
  }, [expandableIds])

  const handleToggleStatus = React.useCallback(
    async (row: AdminMenuRow, next: boolean) => {
      setPendingId(row.id)
      try {
        const result = await toggleMenuStatus(row.id, next ? 1 : 0)
        if (result.code === 200) {
          toast.success(result.message || "状态已更新")
          router.refresh()
        } else {
          toast.error(result.message || "切换状态失败")
        }
      } catch {
        toast.error("切换状态失败，请稍后再试")
      } finally {
        setPendingId(null)
      }
    },
    [router]
  )

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await refreshMenuCache()
      if (result.code === 200) {
        toast.success(result.message || "已刷新，侧栏即时生效")
        router.refresh()
      } else {
        toast.error(result.message || "刷新失败")
      }
    } catch {
      toast.error("刷新失败，请稍后再试")
    } finally {
      setRefreshing(false)
    }
  }, [router])

  const handleDelete = React.useCallback(async () => {
    if (!confirmRow) return
    setDeleting(true)
    try {
      const result = await deleteMenu(confirmRow.id)
      if (result.code === 200) {
        toast.success(result.message || "已删除")
        setConfirmRow(null)
        router.refresh()
      } else {
        toast.error(result.message || "删除失败")
      }
    } catch {
      toast.error("删除失败，请稍后再试")
    } finally {
      setDeleting(false)
    }
  }, [confirmRow, router])

  const openMenuForm = React.useCallback(
    (editing: AdminMenuRow | null, parentId: number | null, opener?: Element | null) => {
      const parent = rows.find((row) => row.id === parentId)
      const defaultPosition: AdminMenuPosition =
        editing?.position ?? parent?.position ?? (surface === "ADMIN" ? "ADMIN" : "BLOG_NAV")
      openDialog(
        {
          title: editing ? "修改菜单" : "新增菜单",
          headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
          titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
          contentClassName: "admin-shell admin-dialog-content w-[620px] max-w-[calc(100vw-2rem)]",
          contentProps: { showCloseButton: false, "data-preset": preset },
          footer: null,
          render: ({ close, onCancel }) => (
            <MenuForm
              editing={editing}
              defaultParentId={parentId}
              rows={rows}
              defaultPosition={defaultPosition}
              onCancel={onCancel}
              onSuccess={(position) => {
                close()
                setSurface(ADMIN_MENU_POSITION_SURFACE[position])
                router.refresh()
              }}
            />
          ),
        },
        opener
      )
    },
    [openDialog, preset, router, rows, surface]
  )

  const openCreate = React.useCallback(
    (parentId: number | null, opener?: Element | null) => {
      openMenuForm(null, parentId, opener)
    },
    [openMenuForm]
  )

  const openEdit = React.useCallback(
    (row: AdminMenuRow, opener?: Element | null) => {
      openMenuForm(row, row.parentId, opener)
    },
    [openMenuForm]
  )

  const columns = React.useMemo<DataTableColumn<VisibleRow>[]>(
    () => [
      {
        key: "name",
        title: "菜单名称",
        fixed: true,
        render: ({ row, depth, expandable }) => {
          const expanded = !collapsed.has(row.id)
          const builtin = row.isBuiltin && !row.generatedFromCategory

          return (
            <div className="flex min-w-max items-center gap-1" style={{ paddingLeft: indentOf(depth) }}>
              {expandable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCollapse(row.id)}
                  aria-label={expanded ? `折叠 ${row.name}` : `展开 ${row.name}`}
                  aria-expanded={expanded}
                  className="size-6 shrink-0 text-[var(--adm-ink-3)] hover:bg-[var(--adm-paper-3)]"
                >
                  <ChevronRight
                    className="size-3.5 transition-transform motion-reduce:transition-none"
                    style={{ transform: expanded ? "rotate(90deg)" : "none" }}
                  />
                </Button>
              ) : (
                <span className="size-6 shrink-0" aria-hidden="true" />
              )}

              <span
                className="text-sm leading-snug md:text-base"
                style={{ color: builtin ? "var(--adm-ink)" : "var(--adm-ink-2)" }}
                title={row.name}
              >
                {row.name}
              </span>
              {row.type === "dir" && (
                <Tag
                  tone="muted"
                  appearance="soft"
                  shape="rounded"
                  size="sm"
                  className="px-1 py-0 text-xs leading-tight"
                >
                  目录
                </Tag>
              )}
              {row.type === "button" && (
                <Tag
                  tone="muted"
                  appearance="soft"
                  shape="rounded"
                  size="sm"
                  className="px-1 py-0 text-xs leading-tight"
                >
                  按钮
                </Tag>
              )}
              {row.generatedFromCategory && (
                <Tag
                  tone="primary"
                  appearance="soft"
                  shape="rounded"
                  size="sm"
                  className="px-1 py-0 text-xs leading-tight"
                >
                  分类权限
                </Tag>
              )}
              {builtin && (
                <Tag
                  tone="primary"
                  appearance="soft"
                  shape="rounded"
                  size="sm"
                  className="px-1 py-0 text-xs leading-tight"
                >
                  内置
                </Tag>
              )}
            </div>
          )
        },
      },
      {
        key: "icon",
        title: "图标",
        align: "center",
        width:'80px',
        render: ({ row }) =>
          row.icon ? (
            <span className="inline-grid place-items-center" style={{ color: "var(--adm-ink-2)" }} title={row.icon}>
              <AdminIcon name={row.icon} className="size-4" />
            </span>
          ) : (
            <span style={{ color: "var(--adm-ink-3)" }}>—</span>
          ),
      },
      {
        key: "position",
        title: "位置",
        render: ({ row }) => (
          <span className="text-sm whitespace-nowrap md:text-base" style={{ color: "var(--adm-ink-2)" }}>
            {ADMIN_MENU_POSITION_OPTIONS.find((option) => option.value === row.position)?.label ?? row.position}
          </span>
        ),
      },
      {
        key: "sort",
        title: "排序",
        align: "center",
        width:'80px',
        render: ({ row }) => <span className="tabular-nums">{row.sort}</span>,
      },
      {
        key: "permissionKey",
        title: "权限标识",
        render: ({ row }) => {
          if (!row.permissionKey) return <span style={{ color: "var(--adm-ink-3)" }}>—</span>
          const grantCount = grantCounts[row.permissionKey] ?? 0
          return (
            <span className="inline-flex min-w-0 items-center gap-1">
              <span
                className="font-mono text-sm leading-tight md:text-base"
                style={{ color: "var(--adm-ink-2)" }}
                title={row.permissionKey}
              >
                {row.permissionKey}
              </span>
              {grantCount > 0 && (
                <span
                  className="shrink-0 text-sm leading-tight tabular-nums md:text-base"
                  style={{ color: "var(--adm-ink-3)" }}
                  title={`${grantCount} 个角色已授权`}
                >
                  ({grantCount})
                </span>
              )}
            </span>
          )
        },
      },
      {
        key: "component",
        title: surface === "BLOG" ? "站内链接" : "组件路径",
        render: ({ row }) =>
          (surface === "BLOG" ? row.path : row.component) ? (
            <span
              className="block font-mono text-sm leading-tight md:text-base"
              style={{ color: "var(--adm-ink-3)" }}
              title={(surface === "BLOG" ? row.path : row.component) ?? ""}
            >
              {surface === "BLOG" ? row.path : row.component}
            </span>
          ) : (
            <span style={{ color: "var(--adm-ink-3)" }}>—</span>
          ),
      },
      {
        key: "componentName",
        title: "组件名称",
        render: ({ row }) =>
          row.componentName ? (
            <span
              className="block font-mono text-sm leading-tight md:text-base"
              style={{ color: "var(--adm-ink-3)" }}
              title={row.componentName}
            >
              {row.componentName}
            </span>
          ) : (
            <span style={{ color: "var(--adm-ink-3)" }}>—</span>
          ),
      },
      {
        key: "status",
        title: "状态",
        align: "center",
        width:'100px',
        render: ({ row }) =>
          row.generatedFromCategory ? (
            <Tag tone={row.status === 1 ? "success" : "muted"} appearance="soft" shape="rounded" size="sm">
              {row.status === 1 ? "启用" : "停用"}
            </Tag>
          ) : (
            <Switch
              size="sm"
              checked={row.status === 1}
              disabled={!canUpdate || pendingId === row.id}
              onCheckedChange={(next) => void handleToggleStatus(row, next)}
              aria-label={`${row.name} 状态`}
              className={cn(
                "data-[state=checked]:bg-[var(--adm-c3)] data-[state=unchecked]:bg-[var(--adm-line)]",
                "dark:data-[state=checked]:bg-[var(--adm-c3)] dark:data-[state=unchecked]:bg-[var(--adm-line)]",
                "[&_[data-slot=switch-thumb]]:bg-white"
              )}
            />
          ),
      },
      {
        key: "actions",
        title: "操作",
        align: "center",
        fixed: 'right',
        render: ({ row }) => (
          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
            {canUpdate && !row.generatedFromCategory && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => openEdit(row, event.currentTarget)}
                className="h-7 px-1.5 text-xs md:text-sm"
                style={{ color: "var(--adm-ink-2)" }}
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
            {canCreate && row.type !== "button" && !row.generatedFromCategory && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(event) => openCreate(row.id, event.currentTarget)}
                className="h-7 px-1.5 text-xs md:text-sm"
                style={{ color: "var(--adm-c1)" }}
              >
                <Plus className="size-3.5" />
              </Button>
            )}
            {canDelete && !row.generatedFromCategory && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRow(row)}
                className="h-7 px-1.5 text-xs md:text-sm"
                style={{ color: "var(--adm-c2)" }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [
      canCreate,
      canDelete,
      canUpdate,
      collapsed,
      grantCounts,
      handleToggleStatus,
      openCreate,
      openEdit,
      pendingId,
      surface,
      toggleCollapse,
    ]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FilterForm
        fields={MENU_FILTER_FIELDS}
        basePath="/admin/settings/permissions"
        className="adm-rise mb-2 shrink-0"
      />

      <div className="adm-rise mb-2 shrink-0" style={{ ["--i" as string]: 2 }}>
        <TableToolbar
          className="flex-wrap"
          action={
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              {canCreate && (
                <ToolbarActionButton onClick={(event) => openCreate(null, event.currentTarget)}>
                  <Plus className="size-3.5" />
                  {surface === "BLOG" ? "新增博客菜单" : "新增菜单"}
                </ToolbarActionButton>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAll}
                className="h-8 text-sm md:text-base"
                style={{ borderColor: "var(--adm-line)", color: "var(--adm-ink-2)" }}
              >
                {collapsed.size > 0 ? "展开全部" : "折叠全部"}
              </Button>

              {canUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 text-sm md:text-base"
                  style={{ borderColor: "var(--adm-line)", color: "var(--adm-ink-2)" }}
                >
                  <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
                  {refreshing ? "刷新中…" : "刷新缓存"}
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div
        className="adm-rise mb-2 flex shrink-0 gap-1 rounded-lg border p-1"
        style={{ borderColor: "var(--adm-line)", background: "var(--adm-paper-2)" }}
        role="tablist"
        aria-label="权限范围"
      >
        {(
          [
            ["ADMIN", "后台菜单"],
            ["BLOG", "博客菜单"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={surface === value}
            onClick={() => setSurface(value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors md:text-base",
              surface === value ? "bg-[var(--adm-paper-3)] font-medium" : "hover:bg-[var(--adm-paper-3)]"
            )}
            style={{ color: surface === value ? "var(--adm-c1)" : "var(--adm-ink-2)" }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="adm-rise flex min-h-0 flex-1 flex-col" style={{ ["--i" as string]: 3 }}>
        <DataTable
          columns={columns}
          rows={visibleRows}
          rowKey={({ row }) => row.id}
          dense
          caption="菜单与权限配置"
          empty={<Empty type="search" text="没有匹配的菜单" imageClass="hidden" className="py-2" />}
          className="flex min-h-0 flex-1 flex-col"
          scrollClassName="min-h-0 flex-1 overflow-y-auto [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
        />
      </div>
      <PopupDialog
        open={confirmRow !== null}
        onOpenChange={(next) => {
          if (!next) setConfirmRow(null)
        }}
        onCancel={() => setConfirmRow(null)}
        title="删除菜单"
        description={
          <>
            确定删除「{confirmRow?.name}」及其所有子项？相关角色授权会一并清除，此操作不可撤销。
            {confirmRow?.isBuiltin && (
              <span className="mt-2 block text-[var(--adm-c2)]">
                这是系统内置菜单，删除后对应导航和页面权限会一并移除。
              </span>
            )}
          </>
        }
        headerClassName="border-[var(--adm-line)] px-5 text-left"
        titleClassName="adm-serif text-base md:text-lg text-[var(--adm-ink)]"
        footerClassName="border-[var(--adm-line)]"
        contentClassName="admin-shell admin-dialog-content w-[400px] max-w-[calc(100vw-2rem)]"
        contentProps={{ showCloseButton: false, "data-preset": preset }}
        footer={
          <div className="flex justify-end gap-2 border-t border-[var(--adm-line)] px-5 py-3">
            <Button type="button" variant="outline" onClick={() => setConfirmRow(null)} disabled={deleting}>
              取消
            </Button>
            <Button
              type="button"
              className="admin-dialog-submit"
              style={{ background: "var(--adm-c2)", color: "var(--adm-paper-2)" }}
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "删除中…" : "删除"}
            </Button>
          </div>
        }
      />
    </div>
  )
}
