"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { AdminIcon } from "@/app/admin/components/admin-icons"
import { usePermission } from "@/components/admin/permission-context"
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Empty } from "@/components/k-view/Empty"
import { Tag } from "@/components/k-view/Tag"
import { Switch } from "@/components/ui/switch"
import type { AdminMenuRow } from "@/lib/admin-menu-seed"
import { indexByParent } from "@/lib/menu-tree"
import { cn } from "@/lib/utils"
import { deleteMenu, refreshMenuCache, toggleMenuStatus } from "@/service/menu"
import { MenuFormDialog } from "./MenuFormDialog"
import { AdminDialogContent } from "../../components/AdminDialogContent"

/**
 * 菜单管理（树形表格）。
 *
 * ── 布局是硬约束 ──
 * 1440×900 下整页不能出现滚动条，所以三段式：
 * 工具条 shrink-0 → 表格卡片 flex-1 min-h-0（内部滚动，表头 sticky）。
 * 行高全部走 py-[5px] / 13px 字号，32 行在内滚区里刚好放得下。
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
    roles: Array<{ code: string; name: string; isBuiltin: boolean }>
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

    return {childrenOf, expandableIds}
}

const rowButtonClass =
    "cursor-pointer rounded px-1.5 py-0.5 text-xs md:text-sm leading-tight transition-colors hover:bg-[var(--adm-paper-3)]"

export function MenuManager({rows, grantCounts, roles, allowed}: MenuManagerProps) {
    const router = useRouter()
    const {can} = usePermission()
    // 确认弹窗也是 Portal，需要把主题 token 一起带过去（见 MenuFormDialog 里的说明）

    // allowed 来自本页服务端计算，can 来自 layout 注入；两者同源，任一命中即放行
    const allowedSet = React.useMemo(() => new Set(allowed), [allowed])
    const canDo = React.useCallback(
        (key: string) => allowedSet.has(key) || can(key),
        [allowedSet, can],
    )
    const canCreate = canDo("action:menu:create")
    const canUpdate = canDo("action:menu:update")
    const canDelete = canDo("action:menu:delete")

    const {childrenOf, expandableIds} = React.useMemo(() => buildIndex(rows), [rows])

    const [keywordInput, setKeywordInput] = React.useState("")
    const [keyword, setKeyword] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<"all" | "1" | "0">("all")
    const [collapsed, setCollapsed] = React.useState<ReadonlySet<number>>(() => new Set<number>())
    const [pendingId, setPendingId] = React.useState<number | null>(null)
    const [refreshing, setRefreshing] = React.useState(false)
    const [confirmRow, setConfirmRow] = React.useState<AdminMenuRow | null>(null)
    const [deleting, setDeleting] = React.useState(false)
    const [dialog, setDialog] = React.useState<{
        open: boolean
        editing: AdminMenuRow | null
        parentId: number | null
    }>({open: false, editing: null, parentId: null})

    const filtering = keyword.trim() !== "" || statusFilter !== "all"

    /* ---------------- 筛选 + 展开态 → 可见行 ---------------- */
    const visibleRows = React.useMemo<VisibleRow[]>(() => {
        const needle = keyword.trim().toLowerCase()
        const keep = new Set<number>()
        const byId = new Map(rows.map((row) => [row.id, row]))

        for (const row of rows) {
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
                out.push({row, depth, expandable})
                if (!expandable || effectiveCollapsed.has(row.id)) continue
                walk(row.id, depth + 1)
            }
        }
        walk(null, 0)
        return out
    }, [rows, childrenOf, keyword, statusFilter, collapsed, filtering])

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

    const handleSearch = React.useCallback(() => {
        setKeyword(keywordInput)
    }, [keywordInput])

    const handleReset = React.useCallback(() => {
        setKeywordInput("")
        setKeyword("")
        setStatusFilter("all")
        setCollapsed(new Set<number>())
    }, [])

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
        [router],
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

    const openCreate = React.useCallback((parentId: number | null) => {
        setDialog({open: true, editing: null, parentId})
    }, [])

    const openEdit = React.useCallback((row: AdminMenuRow) => {
        setDialog({open: true, editing: row, parentId: row.parentId})
    }, [])

    const closeDialog = React.useCallback(() => {
        setDialog({open: false, editing: null, parentId: null})
    }, [])

    return (
        <>
            {/* ── 工具条 ── */}
            <div className="adm-rise mb-2 flex shrink-0 flex-wrap items-center gap-2">
                <Input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault()
                            handleSearch()
                        }
                    }}
                    placeholder="菜单名称…"
                    aria-label="菜单名称"
                    className="h-8 w-full min-w-0 text-sm md:text-base min-[400px]:w-[180px]"
                    autoComplete="off"
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "all" | "1" | "0")}
                    aria-label="状态"
                    className="h-8 cursor-pointer rounded-md border bg-transparent px-2 text-sm md:text-base outline-none transition-colors focus:border-[var(--adm-c2)]"
                    style={{
                        borderColor: "var(--adm-line)",
                        color: "var(--adm-ink)",
                        background: "var(--adm-paper-2)",
                    }}
                >
                    <option value="all">全部状态</option>
                    <option value="1">正常</option>
                    <option value="0">停用</option>
                </select>

                <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-2.5 text-sm md:text-base transition-colors adm-action"
                >
                    <Search className="size-3.5"/>
                    搜索
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="h-8 cursor-pointer rounded-md border px-2.5 text-sm md:text-base transition-colors hover:bg-[var(--adm-paper-3)]"
                    style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
                >
                    重置
                </button>

                <span className="ml-1 hidden text-xs md:text-sm tracking-[0.08em] sm:inline" style={{color: "var(--adm-ink-3)"}}>
                    显示 {visibleRows.length} / {rows.length} 项 · {roles.length} 个角色
                </span>

                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onClick={toggleAll}
                        className="h-8 cursor-pointer rounded-md border px-2.5 text-sm md:text-base transition-colors hover:bg-[var(--adm-paper-3)]"
                        style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
                    >
                        {collapsed.size > 0 ? "展开全部" : "折叠全部"}
                    </button>

                    {canUpdate && (
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border px-2.5 text-sm md:text-base transition-colors hover:bg-[var(--adm-paper-3)] disabled:cursor-not-allowed disabled:opacity-45"
                            style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
                        >
                            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")}/>
                            {refreshing ? "刷新中…" : "刷新缓存"}
                        </button>
                    )}

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() => openCreate(null)}
                            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md px-3 text-sm md:text-base transition-colors adm-action"
                        >
                            <Plus className="size-3.5"/>
                            新增
                        </button>
                    )}
                </div>
            </div>

            {/* ── 表格卡片 ── */}
            <section
                className="adm-rise flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border"
                style={{borderColor: "var(--adm-line)", background: "var(--adm-paper-2)", "--i": 1} as React.CSSProperties}
            >
                <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full border-separate border-spacing-0 text-left">
                        <thead className="sticky top-0 z-10">
                            <tr style={{background: "var(--adm-paper-2)"}}>
                                {[
                                    {label: "菜单名称", align: "left"},
                                    {label: "图标", align: "center"},
                                    {label: "排序", align: "center"},
                                    {label: "权限标识", align: "left"},
                                    {label: "组件路径", align: "left"},
                                    {label: "组件名称", align: "left"},
                                    {label: "状态", align: "center"},
                                    {label: "操作", align: "right"},
                                ].map((column) => (
                                    <th
                                        key={column.label}
                                        scope="col"
                                        className={cn(
                                            "border-b px-3 py-1.5 text-xs md:text-sm font-normal leading-snug tracking-[0.1em] whitespace-nowrap",
                                            column.align === "center" && "text-center",
                                            column.align === "right" && "text-right",
                                        )}
                                        style={{
                                            borderColor: "var(--adm-line)",
                                            color: "var(--adm-ink-3)",
                                            background: "var(--adm-paper-2)",
                                        }}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {visibleRows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="border-b px-4 text-center" style={{borderColor: "var(--adm-line-2)"}}>
                                        <Empty type="search" text="没有匹配的菜单" imageClass="hidden" className="py-2"/>
                                    </td>
                                </tr>
                            )}

                            {visibleRows.map(({row, depth, expandable}) => {
                                const expanded = !collapsed.has(row.id)
                                const grantCount = row.permissionKey ? (grantCounts[row.permissionKey] ?? 0) : 0
                                const statusPending = pendingId === row.id
                                const builtin = row.isBuiltin

                                return (
                                    <tr key={row.id} className="transition-colors hover:bg-[var(--adm-paper-3)]">
                                        <td
                                            className="border-b px-3 py-[5px]"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            <div
                                                className="flex items-center gap-1"
                                                style={{paddingLeft: indentOf(depth)}}
                                            >
                                                {expandable ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCollapse(row.id)}
                                                        aria-label={expanded ? `折叠 ${row.name}` : `展开 ${row.name}`}
                                                        aria-expanded={expanded}
                                                        className="grid size-4 shrink-0 cursor-pointer place-items-center rounded transition-colors hover:bg-[var(--adm-paper-3)]"
                                                        style={{color: "var(--adm-ink-3)"}}
                                                    >
                                                        <ChevronRight
                                                            className="size-3.5 transition-transform"
                                                            style={{
                                                                transform: expanded ? "rotate(90deg)" : "none",
                                                                transitionDuration: "180ms",
                                                            }}
                                                        />
                                                    </button>
                                                ) : (
                                                    <span className="size-4 shrink-0"/>
                                                )}

                                                <span
                                                    className="text-sm md:text-base leading-snug"
                                                    style={{color: builtin ? "var(--adm-ink)" : "var(--adm-ink-2)"}}
                                                    title={row.name}
                                                >
                                                    {row.name}
                                                </span>

                                                {row.type === "dir" && <Tag tone="muted" appearance="soft" shape="rounded" size="sm" className="px-1 py-0 text-xs leading-tight">目录</Tag>}
                                                {row.type === "button" && <Tag tone="muted" appearance="soft" shape="rounded" size="sm" className="px-1 py-0 text-xs leading-tight">按钮</Tag>}
                                                {builtin && <Tag tone="primary" appearance="soft" shape="rounded" size="sm" className="px-1 py-0 text-xs leading-tight">内置</Tag>}
                                            </div>
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px] text-center"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            {row.icon ? (
                                                <span
                                                    className="inline-grid place-items-center"
                                                    style={{color: "var(--adm-ink-2)"}}
                                                    title={row.icon}
                                                >
                                                    <AdminIcon name={row.icon} className="size-[15px]"/>
                                                </span>
                                            ) : (
                                                <span className="text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px] text-center text-xs md:text-sm tabular-nums"
                                            style={{borderColor: "var(--adm-line-2)", color: "var(--adm-ink-2)"}}
                                        >
                                            {row.sort}
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px]"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            {row.permissionKey ? (
                                                <span className="inline-flex min-w-0 items-center gap-1">
                                                    <span
                                                        className="font-mono text-xs md:text-sm leading-tight"
                                                        style={{color: "var(--adm-ink-2)"}}
                                                        title={row.permissionKey}
                                                    >
                                                        {row.permissionKey}
                                                    </span>
                                                    {grantCount > 0 && (
                                                        <span
                                                            className="shrink-0 text-xs md:text-sm tabular-nums leading-tight"
                                                            style={{color: "var(--adm-ink-3)"}}
                                                            title={`${grantCount} 个角色已授权`}
                                                        >
                                                            ({grantCount})
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px]"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            {row.component ? (
                                                <span
                                                    className="block font-mono text-xs md:text-sm leading-tight"
                                                    style={{color: "var(--adm-ink-3)"}}
                                                    title={row.component}
                                                >
                                                    {row.component}
                                                </span>
                                            ) : (
                                                <span className="text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px]"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            {row.componentName ? (
                                                <span
                                                    className="block font-mono text-xs md:text-sm leading-tight"
                                                    style={{color: "var(--adm-ink-3)"}}
                                                    title={row.componentName}
                                                >
                                                    {row.componentName}
                                                </span>
                                            ) : (
                                                <span className="text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px] text-center"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            <div className="flex items-center justify-center">
                                                <Switch
                                                    size="sm"
                                                    checked={row.status === 1}
                                                    disabled={!canUpdate || builtin || statusPending}
                                                    onCheckedChange={(next) => {
                                                        void handleToggleStatus(row, next === true)
                                                    }}
                                                    aria-label={`${row.name} 状态`}
                                                    title={builtin ? "内置菜单不可停用" : undefined}
                                                    className={cn(
                                                        "data-[state=checked]:bg-[var(--adm-c3)]",
                                                        "data-[state=unchecked]:bg-[var(--adm-line)]",
                                                        "dark:data-[state=checked]:bg-[var(--adm-c3)]",
                                                        "dark:data-[state=unchecked]:bg-[var(--adm-line)]",
                                                        "[&_[data-slot=switch-thumb]]:bg-white",
                                                    )}
                                                />
                                            </div>
                                        </td>

                                        <td
                                            className="border-b px-3 py-[5px]"
                                            style={{borderColor: "var(--adm-line-2)"}}
                                        >
                                            <div className="flex items-center justify-end gap-0.5">
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(row)}
                                                        className={cn(rowButtonClass, "inline-flex items-center gap-0.5")}
                                                        style={{color: "var(--adm-ink-2)"}}
                                                    >
                                                        <Pencil className="size-3"/>
                                                        修改
                                                    </button>
                                                )}
                                                {canCreate && row.type !== "button" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openCreate(row.id)}
                                                        className={cn(rowButtonClass, "inline-flex items-center gap-0.5")}
                                                        style={{color: "var(--adm-c1)"}}
                                                    >
                                                        <Plus className="size-3"/>
                                                        新增
                                                    </button>
                                                )}
                                                {canDelete && !builtin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmRow(row)}
                                                        className={cn(rowButtonClass, "inline-flex items-center gap-0.5")}
                                                        style={{color: "var(--adm-c2)"}}
                                                    >
                                                        <Trash2 className="size-3"/>
                                                        删除
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <MenuFormDialog
                open={dialog.open}
                editing={dialog.editing}
                defaultParentId={dialog.parentId}
                rows={rows}
                onClose={closeDialog}
            />

            {/* 删除二次确认 */}
            <Dialog
                open={confirmRow !== null}
                onOpenChange={(next) => {
                    if (!next) setConfirmRow(null)
                }}
            >
                <AdminDialogContent
                    showCloseButton={false}
                    className="w-[400px]"
                >
                    <DialogHeader className="border-b px-5 py-3 text-left" style={{borderColor: "var(--adm-line)"}}>
                        <DialogTitle className="adm-serif text-base md:text-lg" style={{color: "var(--adm-ink)"}}>
                            删除菜单
                        </DialogTitle>
                    </DialogHeader>

                    <p className="px-5 py-4 text-sm md:text-base leading-snug" style={{color: "var(--adm-ink-2)"}}>
                        确定删除「{confirmRow?.name}」及其所有子项？
                        <br/>
                        相关角色的授权会一并清除，此操作不可撤销。
                    </p>

                    <DialogFooter
                        className="border-t px-5 py-3 sm:justify-end"
                        style={{borderColor: "var(--adm-line)"}}
                    >
                        <button
                            type="button"
                            onClick={() => setConfirmRow(null)}
                            className="admin-dialog-cancel"
                        >
                            取消
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="h-8 cursor-pointer rounded-md px-4 text-sm md:text-base transition-colors disabled:cursor-not-allowed disabled:opacity-45"
                            style={{background: "var(--adm-c2)", color: "var(--adm-paper-2)"}}
                        >
                            {deleting ? "删除中…" : "删除"}
                        </button>
                    </DialogFooter>
                </AdminDialogContent>
            </Dialog>
        </>
    )
}
