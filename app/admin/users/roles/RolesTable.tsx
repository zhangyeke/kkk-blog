"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { usePermission } from "@/components/admin/permission-context"
import { DataTable, type DataTableColumn, DataTablePager } from "@/components/k-view/DataTable"
import { Empty } from "@/components/k-view/Empty"
import type { CustomControlProps } from "@/components/k-view/Form/type"
import { SegmentedControl } from "@/components/k-view/Form/components/SegmentedControl"
import { Tag } from "@/components/k-view/Tag"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {useAdminTheme} from "@/app/admin/components/AdminShell"
import { AdminForm } from "@/app/admin/components/AdminForm"
import { ToolbarActionButton } from "@/app/admin/components/ToolbarActionButton"
import { TableToolbar } from "@/app/admin/components/TableToolbar"
import type { AdminMenuRow } from "@/lib/admin-menu-seed"
import { cn } from "@/lib/utils"
import { createRole, deleteRole, type RoleListRow, updateRole } from "@/service/role"
import { roleFormSchema } from "@/validators/role"
import { RolePermissionDialog } from "./RolePermissionDialog"
import { AdminDialogContent } from "../../components/AdminDialogContent"

/**
 * 角色管理列表。
 *
 * ── 数据流是单向的 ──
 * 筛选条件放在 URL 里（服务端过滤），写操作走 server action 后 router.refresh()。
 * 组件里不维护「角色副本」，避免刷新后本地状态和服务端打架。
 *
 * ── 布局是硬约束 ──
 * 1440×900 下整页不能出现滚动条：容器 flex 纵向三段式，
 * 工具条 shrink-0 → 表格 flex-1 min-h-0（内部滚动）→ 分页随表格底部。
 */

/** 筛选条件（与 page.tsx 的 URL 解析结果同构） */
export type RoleQuery = {
    keyword: string
    type: "all" | "builtin" | "custom"
    status: "all" | "1" | "0"
}

type RoleFormValue = {
    code: string
    name: string
    description: string
    scopeAll: boolean
    status: number
}

export type RolesTableProps = {
    rows: RoleListRow[]
    /** 过滤后的总数 */
    total: number
    /** 当前用户拥有的权限 key 全集，与 usePermission 同源，做双保险 */
    allowed: string[]
    /** 全量菜单行：分配权限弹窗按它建树 */
    menuRows: AdminMenuRow[]
    query: RoleQuery
}

/**
 * superAdmin 的权限数哨兵（与 service/role.ts 的 ALL_PERMISSION_COUNT 对应）。
 *
 * 超管没有授权行，服务端用负数表示「全部」；这里只要见到负数就渲染成「全部」，
 * 不把具体数值写死，将来换成别的哨兵值也不用改前端。
 */
const ALL_PERMISSION_COUNT = -1

const SUPER_ADMIN = "superAdmin"

const rowButtonClass =
    "inline-flex cursor-pointer items-center gap-0.5 rounded px-1.5 py-0.5 text-xs md:text-sm leading-tight transition-colors hover:bg-[var(--adm-paper-3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"

/** 小标签：类型 / 状态共用一套视觉 */
function Badge({label, tone}: {label: string; tone: "builtin" | "custom" | "on" | "off"}) {
    const tagTone = tone === "builtin" ? "primary" : tone === "on" ? "success" : tone === "off" ? "muted" : "neutral"
    const appearance = tone === "custom" ? "outline" : "soft"
    return <Tag tone={tagTone} appearance={appearance} shape="rounded" size="sm" className="px-1.5 py-0.5 leading-tight">{label}</Tag>
}

export function RolesTable({rows, total, allowed, menuRows, query}: RolesTableProps) {
    const router = useRouter()
    const {can} = usePermission()
    // 确认弹窗也是 Portal，需要把主题 token 一起带过去

    // allowed 来自本页服务端计算，can 来自 layout 注入；两者同源，任一命中即放行
    const allowedSet = React.useMemo(() => new Set(allowed), [allowed])
    const canDo = React.useCallback((key: string) => allowedSet.has(key) || can(key), [allowedSet, can])

    const canCreate = canDo("action:role:create")
    const canUpdate = canDo("action:role:update")
    const canDelete = canDo("action:role:delete")
    const canAssign = canDo("action:role:assign")

    const busy = useTableBusy()
    const [permissionDialog, setPermissionDialog] = React.useState<{open: boolean; role: RoleListRow | null}>({
        open: false,
        role: null,
    })
    const [confirmRow, setConfirmRow] = React.useState<RoleListRow | null>(null)
    const [deleting, setDeleting] = React.useState(false)
    const {openDialog} = useRenderDialog()
    const {preset} = useAdminTheme()

    function openRoleForm(editing: RoleListRow | null, opener?: Element | null) {
        openDialog({
            title: editing ? "修改角色" : "新增角色",
            headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
            titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
            contentClassName: "z-50 admin-shell admin-dialog-content w-[540px]",
            contentProps: {showCloseButton: false, "data-preset": preset},
            render: ({close, onCancel}) => (
                <AdminForm
                    schema={roleFormSchema}
                    defaultValues={{
                        code: editing?.code ?? "",
                        name: editing?.name ?? "",
                        description: editing?.description ?? "",
                        scopeAll: editing?.scopeAll ?? false,
                        status: editing?.status === 0 ? 0 : 1,
                    }}
                    save={(input: RoleFormValue) => {
                        if (editing) {
                            const isBuiltin = editing.isBuiltin
                            return updateRole({
                                id: editing.id,
                                code: input.code,
                                name: input.name,
                                description: input.description,
                                scopeAll: input.scopeAll,
                                ...(isBuiltin ? {} : {status: input.status === 0 ? 0 : 1}),
                            })
                        }

                        return createRole({
                            code: input.code,
                            name: input.name,
                            description: input.description,
                            scopeAll: input.scopeAll,
                        })
                    }}
                    formComponents={{
                        roleCode: (props) => <Input {...props} disabled={editing !== null} className="admin-dialog-input font-mono" autoComplete="off" />,
                        roleScope: (props) => (
                            <div>
                                <SegmentedControl
                                    ariaLabel="数据范围"
                                    options={[{value: true, label: "全量"}, {value: false, label: "仅本人"}]}
                                    value={Boolean(props.value)}
                                    onChange={props.onChange}
                                    testIdPrefix="role-scope"
                                />
                                <p className="mt-1 text-xs" style={{color: "var(--adm-ink-3)"}}>
                                    {props.value ? "可查看全部数据" : "只能看到自己的数据"}
                                </p>
                            </div>
                        ),
                        roleStatus: (props: CustomControlProps) => (
                            <SegmentedControl
                                ariaLabel="角色状态"
                                options={[{value: 1, label: "开启"}, {value: 0, label: "关闭"}]}
                                value={Number(props.value) === 0 ? 0 : 1}
                                onChange={props.onChange}
                                disabled={editing?.isBuiltin ?? false}
                                testIdPrefix="role-status-value"
                            />
                        ),
                    }}
                    onCancel={onCancel}
                    onSuccess={() => {close(); router.refresh()}}
                    successMessage={editing ? "角色已更新" : "角色已创建"}
                    submitLabel="保存"
                    pendingLabel="保存中…"
                    submitTestId="role-form-submit"
                    notice={editing?.isBuiltin ? "内置角色的标识与状态不可修改。" : undefined}
                />
            ),
        }, opener)
    }

    /* ---------------- 删除 ---------------- */
    const handleDelete = React.useCallback(async () => {
        if (!confirmRow) return
        setDeleting(true)
        try {
            const result = await deleteRole(confirmRow.id)
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

    /* ---------------- 列 ---------------- */
    const columns = React.useMemo<DataTableColumn<RoleListRow>[]>(
        () => [
            {
                key: "name",
                title: "显示名",
                render: (row) => (
                    <div className="flex items-center gap-1.5">
                        <span className="adm-serif text-sm md:text-base" style={{color: "var(--adm-ink)"}} title={row.name}>
                            {row.name}
                        </span>
                        {row.code === SUPER_ADMIN && <Badge label="超管" tone="builtin"/>}
                    </div>
                ),
            },
            {
                key: "code",
                title: "角色标识",
                className: "font-mono text-xs md:text-sm text-[var(--adm-ink-2)]",
            },
            {
                key: "description",
                title: "描述",
                render: (row) => (
                    <span
                        className="text-sm md:text-base"
                        style={{color: row.description ? "var(--adm-ink-2)" : "var(--adm-ink-3)"}}
                        title={row.description ?? ""}
                    >
                        {row.description || "—"}
                    </span>
                ),
            },
            {
                key: "memberCount",
                title: "成员数",
                align: "right",
                render: (row) => (
                    <span className="tabular-nums text-sm md:text-base" style={{color: "var(--adm-ink-2)"}}>
                        {row.memberCount}
                    </span>
                ),
            },
            {
                key: "permissionCount",
                title: "权限数",
                align: "right",
                render: (row) =>
                    row.permissionCount <= ALL_PERMISSION_COUNT ? (
                        <span className="text-xs md:text-sm" style={{color: "var(--adm-c1)"}} title="超级管理员拥有全部权限">
                            全部
                        </span>
                    ) : (
                        <span className="tabular-nums text-sm md:text-base" style={{color: "var(--adm-ink-2)"}}>
                            {row.permissionCount}
                        </span>
                    ),
            },
            {
                key: "status",
                title: "状态",
                align: "center",
                render: (row) => <Badge label={row.status === 1 ? "正常" : "停用"} tone={row.status === 1 ? "on" : "off"}/>,
            },
            {
                key: "type",
                title: "类型",
                align: "center",
                render: (row) => <Badge label={row.isBuiltin ? "内置" : "自定义"} tone={row.isBuiltin ? "builtin" : "custom"}/>,
            },
            {
                key: "actions",
                title: "操作",
                align: "right",
                render: (row) => {
                    const isSuperAdmin = row.code === SUPER_ADMIN
                    return (
                        <div className="flex items-center justify-end gap-0.5">
                            {canUpdate && (
                                <button
                                    type="button"
                                    onClick={(event) => openRoleForm(row, event.currentTarget)}
                                    className={rowButtonClass}
                                    style={{color: "var(--adm-ink-2)"}}
                                    data-role-action="edit"
                                    data-role-code={row.code}
                                >
                                    <Pencil className="size-3"/>
                                    修改
                                </button>
                            )}

                            {canAssign && (
                                <button
                                    type="button"
                                    /*
                                     * superAdmin 用 aria-disabled 而不是原生 disabled：
                                     * 原生 disabled 会让按钮完全不可点，用户就看不到
                                     * 「它确实拥有全部权限」这件事（弹窗里是全勾 + 只读）。
                                     * 视觉与语义上仍是禁用态，点击只打开只读弹窗，改不了任何东西。
                                     */
                                    aria-disabled={isSuperAdmin}
                                    title={isSuperAdmin ? "超级管理员拥有全部权限，不可修改" : "分配权限"}
                                    onClick={() => setPermissionDialog({open: true, role: row})}
                                    className={cn(rowButtonClass, isSuperAdmin && "cursor-not-allowed opacity-45 hover:bg-transparent")}
                                    style={{color: "var(--adm-c1)"}}
                                    data-role-action="assign"
                                    data-role-code={row.code}
                                >
                                    <KeyRound className="size-3"/>
                                    分配权限
                                </button>
                            )}

                            {canDelete && !row.isBuiltin && (
                                <button
                                    type="button"
                                    onClick={() => setConfirmRow(row)}
                                    className={rowButtonClass}
                                    style={{color: "var(--adm-c2)"}}
                                    data-role-action="delete"
                                    data-role-code={row.code}
                                >
                                    <Trash2 className="size-3"/>
                                    删除
                                </button>
                            )}
                        </div>
                    )
                },
            },
        ],
        [canAssign, canDelete, canUpdate],
    )

    return (
        <>
            {/* ── 工具条 ── */}
            <div className="adm-rise mb-2 shrink-0">
                <TableToolbar action={canCreate ? (
                    <ToolbarActionButton onClick={(event) => openRoleForm(null, event.currentTarget)} data-testid="role-create">
                        <Plus className="size-4" aria-hidden="true"/>新增角色
                    </ToolbarActionButton>
                ) : undefined}/>
            </div>

            {/* ── 表格卡片 ── */}
            <div
                className="adm-rise flex min-h-0 flex-1 flex-col"
                style={{"--i": 1} as React.CSSProperties}
            >
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey={(row) => row.id}
                    caption="角色列表"
                    busy={busy.pending}
                    className="min-h-0 flex-1 overflow-auto"
                    empty={<Empty type="search" text="没有匹配的角色"/>}
                    footer={
                        total > 0 ? (
                            <DataTablePager
                                page={1}
                                totalPages={1}
                                total={total}
                                basePath="/admin/users/roles"
                                query={{keyword: query.keyword, type: query.type === "all" ? undefined : query.type, status: query.status === "all" ? undefined : query.status}}
                            />
                        ) : undefined
                    }
                />
            </div>

            <RolePermissionDialog
                open={permissionDialog.open}
                role={permissionDialog.role}
                menuRows={menuRows}
                onClose={() => setPermissionDialog({open: false, role: null})}
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
                            删除角色
                        </DialogTitle>
                    </DialogHeader>

                    <p className="px-5 py-4 text-sm md:text-base leading-snug" style={{color: "var(--adm-ink-2)"}}>
                        确定删除「{confirmRow?.name}」？
                        <br/>
                        该角色的授权会一并清除，此操作不可撤销。
                    </p>

                    <DialogFooter className="border-t px-5 py-3 sm:justify-end" style={{borderColor: "var(--adm-line)"}}>
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
                            data-testid="role-delete-confirm"
                        >
                            {deleting ? "删除中…" : "删除"}
                        </button>
                    </DialogFooter>
                </AdminDialogContent>
            </Dialog>
        </>
    )
}
