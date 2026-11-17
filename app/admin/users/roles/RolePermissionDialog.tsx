"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Check, Minus } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AdminMenuRow } from "@/lib/admin/menu-seed"
import type { AdminMenuSurface } from "@/assets/enumerate/global"
import { type AdminMenuNode, buildMenuTree } from "@/lib/admin/menu-tree"
import { cn } from "@/lib/ui/cn"
import { Spinner } from "@/components/k-view/Loader/Spinner"
import { Tag } from "@/components/k-view/Tag"
import { getRoleMenuKeys, type RoleListRow, saveRolePermissions } from "@/service/role"
import { AdminDialogContent } from "../../components/AdminDialogContent"

/**
 * 角色分配权限弹窗（本改造的核心交互）。
 *
 * ── 树的三条规则 ──
 *
 * 1. **目录（dir）没有自己的 permissionKey**：它的勾选状态完全由后代推导，
 *    提交时也不会出现在 keys 里（它压根没有 key 可提交）。这条保证了
 *    RolePermission 表里不会出现「指向目录的假授权」。
 *
 * 2. **父子联动是「全量覆盖后代」**：勾父节点 = 后代全选，取消父 = 后代全清。
 *    反方向（子节点全选 → 父节点自动勾上）不需要写代码，因为父节点状态是
 *    **推导**出来的：hit === total 即勾上，0 < hit < total 即半选。
 *    推导而不是存储，天然避免「父勾着但子没勾」这种自相矛盾的状态。
 *
 * 3. **superAdmin 整棵树全勾且全禁用**：它的权限由 hasPermission 硬短路保证，
 *    DB 里一行授权都不该有。这里把服务端返回的全集画成全勾 + disabled，
 *    并隐藏保存按钮 —— 让用户看到「它确实有全部权限」，而不是看到 0 个勾。
 */

const SUPER_ADMIN = "superAdmin"

/** 拍平后的一行：节点 + 树深度（渲染缩进用） */
type FlatNode = {
    node: AdminMenuNode
    depth: number
}

export type RolePermissionDialogProps = {
    open: boolean
    /** null = 未选中角色（弹窗关闭态） */
    role: RoleListRow | null
    /** 全量菜单行：树必须来自菜单管理页的同一份数据 */
    menuRows: AdminMenuRow[]
    onClose: () => void
}

export function RolePermissionDialog({open, role, menuRows, onClose}: RolePermissionDialogProps) {
    const router = useRouter()
    // 弹窗是 Portal，必须自带主题作用域，否则 var(--adm-*) 解析失败 → 弹窗变透明

    const code = role?.code ?? ""
    const isSuperAdmin = code === SUPER_ADMIN
    const [surface, setSurface] = React.useState<AdminMenuSurface>("ADMIN")

    /** 当前范围的行 → 树；博客分类节点由 PostCategory 实时生成。 */
    const tree = React.useMemo(
        () => buildMenuTree(menuRows.filter((row) => row.surface === surface)),
        [menuRows, surface],
    )

    /** 先序拍平：父在子前，索引与渲染共用 */
    const flat = React.useMemo<FlatNode[]>(() => {
        const out: FlatNode[] = []
        const walk = (nodes: readonly AdminMenuNode[], depth: number): void => {
            for (const node of nodes) {
                out.push({node, depth})
                walk(node.children, depth + 1)
            }
        }
        walk(tree, 0)
        return out
    }, [tree])

    /**
     * 节点 id → 该子树里所有「带 key 的节点」的 key（含自身）。
     *
     * 用 Map 预计算，而不是每次渲染递归：32 个节点虽然便宜，
     * 但勾选一次要重算全部行的状态，预计算能把复杂度从 O(n²) 降到 O(n)。
     */
    const keyMap = React.useMemo(() => {
        const map = new Map<number, string[]>()
        const collect = (node: AdminMenuNode): string[] => {
            const keys: string[] = []
            if (node.row.permissionKey) keys.push(node.row.permissionKey)
            for (const child of node.children) keys.push(...collect(child))
            map.set(node.row.id, keys)
            return keys
        }
        for (const root of tree) collect(root)
        return map
    }, [tree])

    /** 树里出现的全部 key（「全选」用） */
    const allTreeKeys = React.useMemo(() => {
        const keys: string[] = []
        for (const {node} of flat) {
            if (node.row.permissionKey) keys.push(node.row.permissionKey)
        }
        return keys
    }, [flat])

    const [checked, setChecked] = React.useState<ReadonlySet<string>>(() => new Set<string>())
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [saving, setSaving] = React.useState(false)

    // 打开（或换角色）时拉一次当前授权；cancelled 兜住「快速开关导致的竞态覆盖」
    React.useEffect(() => {
        if (!open || code === "") return
        let cancelled = false

        setLoading(true)
        setError(null)

        getRoleMenuKeys(code)
            .then((result) => {
                if (cancelled) return
                if (result.code === 200) {
                    setChecked(new Set(result.data ?? []))
                } else {
                    setChecked(new Set<string>())
                    setError(result.message || "读取角色权限失败")
                }
            })
            .catch(() => {
                if (cancelled) return
                setChecked(new Set<string>())
                setError("读取角色权限失败，请稍后再试")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [open, code])

    /** 单行状态：勾选 / 半选 / 无 key（目录且子树里没 key，禁用） */
    const stateOf = React.useCallback(
        (node: AdminMenuNode) => {
            const keys = keyMap.get(node.row.id) ?? []
            if (keys.length === 0) {
                return {checked: false, indeterminate: false, empty: true, hit: 0, total: 0}
            }
            let hit = 0
            for (const key of keys) {
                if (checked.has(key)) hit += 1
            }
            return {
                checked: hit === keys.length,
                indeterminate: hit > 0 && hit < keys.length,
                empty: false,
                hit,
                total: keys.length,
            }
        },
        [checked, keyMap],
    )

    /** 勾 / 取消一个节点：整棵子树的 key 一起加 / 一起删 */
    const toggleNode = React.useCallback(
        (node: AdminMenuNode) => {
            if (isSuperAdmin) return
            const keys = keyMap.get(node.row.id) ?? []
            if (keys.length === 0) return

            const allChecked = keys.every((key) => checked.has(key))
            setChecked((prev) => {
                const next = new Set(prev)
                for (const key of keys) {
                    if (allChecked) next.delete(key)
                    else next.add(key)
                }
                return next
            })
        },
        [checked, isSuperAdmin, keyMap],
    )

    const handleSelectAll = React.useCallback(() => {
        if (isSuperAdmin) return
        setChecked((previous) => new Set([...previous, ...allTreeKeys]))
    }, [allTreeKeys, isSuperAdmin])

    const handleClear = React.useCallback(() => {
        if (isSuperAdmin) return
        setChecked((previous) => {
            const next = new Set(previous)
            for (const key of allTreeKeys) next.delete(key)
            return next
        })
    }, [allTreeKeys, isSuperAdmin])

    const handleSave = React.useCallback(async () => {
        if (isSuperAdmin || code === "") return
        setSaving(true)
        try {
            const result = await saveRolePermissions({code, keys: Array.from(checked)})
            if (result.code === 200) {
                toast.success(result.message || "权限已保存")
                onClose()
                router.refresh()
            } else {
                toast.error(result.message || "保存失败")
            }
        } catch {
            toast.error("保存失败，请稍后再试")
        } finally {
            setSaving(false)
        }
    }, [checked, code, isSuperAdmin, onClose, router])

    const totalKeys = allTreeKeys.length
    const checkedInTree = allTreeKeys.filter((key) => checked.has(key)).length

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose()
            }}
        >
            <AdminDialogContent
                showCloseButton={false}
                className="w-[600px]"
            >
                <DialogHeader
                    className="shrink-0 border-b px-5 py-3 text-left"
                    style={{borderColor: "var(--adm-line)"}}
                >
                    <DialogTitle className="adm-serif text-base md:text-lg" style={{color: "var(--adm-ink)"}}>
                        分配权限
                        {role && (
                            <span className="ml-2 font-mono text-xs md:text-sm font-normal" style={{color: "var(--adm-ink-3)"}}>
                                {role.code}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex shrink-0 gap-1 border-b px-5 py-2" style={{borderColor: "var(--adm-line-2)"}} role="tablist" aria-label="权限范围">
                    {([ ["ADMIN", "后台菜单"], ["BLOG", "博客菜单"] ] as const).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={surface === value}
                            onClick={() => setSurface(value)}
                            className={cn("rounded-md px-3 py-1.5 text-sm transition-colors", surface === value ? "bg-[var(--adm-paper-3)] font-medium" : "hover:bg-[var(--adm-paper-3)]")}
                            style={{color: surface === value ? "var(--adm-c1)" : "var(--adm-ink-2)"}}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* 快捷操作条 */}
                <div
                    className="flex shrink-0 items-center gap-2 border-b px-5 py-2"
                    style={{borderColor: "var(--adm-line-2)"}}
                >
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        disabled={isSuperAdmin || loading}
                        className="h-7 cursor-pointer rounded-md border px-2.5 text-xs md:text-sm transition-colors hover:bg-[var(--adm-paper-3)] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
                        data-testid="perm-select-all"
                    >
                        全选
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={isSuperAdmin || loading}
                        className="h-7 cursor-pointer rounded-md border px-2.5 text-xs md:text-sm transition-colors hover:bg-[var(--adm-paper-3)] disabled:cursor-not-allowed disabled:opacity-40"
                        style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
                        data-testid="perm-clear"
                    >
                        清空
                    </button>

                    <span className="ml-auto text-xs md:text-sm tabular-nums" style={{color: "var(--adm-ink-3)"}}>
                        已选 {checkedInTree} / {totalKeys}
                    </span>
                </div>

                {isSuperAdmin && (
                    <p
                        className="shrink-0 px-5 pt-3 text-xs md:text-sm leading-tight"
                        style={{color: "var(--adm-ink-3)"}}
                        data-testid="perm-superadmin-hint"
                    >
                        超级管理员拥有全部权限，不可修改
                    </p>
                )}

                {/* 内容区：32 个节点要能滚 */}
                <div className="max-h-[min(60vh,calc(100dvh-8rem))] overflow-y-auto px-3 py-2">
                    {loading && (
                        <Spinner text="加载中…" className="size-5 text-[var(--adm-c1)]" />
                    )}

                    {!loading && error && (
                        <p className="px-2 py-6 text-center text-sm md:text-base" style={{color: "var(--adm-c2)"}}>
                            {error}
                        </p>
                    )}

                    {!loading && !error && (
                        <div className="flex flex-col gap-0.5">
                            {flat.map(({node, depth}) => {
                                const state = stateOf(node)
                                const disabled = isSuperAdmin || state.empty
                                const isButton = node.row.type === "button"
                                const isDir = node.row.type === "dir"

                                return (
                                    <button
                                        key={node.row.id}
                                        type="button"
                                        role="checkbox"
                                        aria-checked={state.indeterminate ? "mixed" : state.checked}
                                        aria-label={node.row.name}
                                        disabled={disabled}
                                        onClick={() => toggleNode(node)}
                                        data-key={node.row.permissionKey ?? ""}
                                        data-name={node.row.name}
                                        className={cn(
                                            "flex w-full min-w-0 items-center gap-2 rounded px-1.5 py-[3px] text-left transition-colors",
                                            "hover:bg-[var(--adm-paper-3)] disabled:cursor-default disabled:hover:bg-transparent",
                                        )}
                                        style={{paddingLeft: 6 + Math.min(depth, 3) * 18}}
                                    >
                                        <span
                                            className="grid size-[15px] shrink-0 place-items-center rounded-[3px] border transition-colors"
                                            style={{
                                                borderColor:
                                                    state.checked || state.indeterminate
                                                        ? "var(--adm-c1)"
                                                        : "var(--adm-line)",
                                                background:
                                                    state.checked || state.indeterminate
                                                        ? "var(--adm-c1)"
                                                        : "transparent",
                                                color: "var(--adm-paper-2)",
                                                opacity: disabled ? 0.6 : 1,
                                            }}
                                        >
                                            {state.indeterminate ? (
                                                <Minus className="size-3"/>
                                            ) : state.checked ? (
                                                <Check className="size-3"/>
                                            ) : null}
                                        </span>

                                        <span
                                            className={cn(
                                                "min-w-0 truncate text-sm md:text-base leading-snug",
                                                isButton && "text-xs md:text-sm",
                                            )}
                                            style={{
                                                color: isDir
                                                    ? "var(--adm-ink)"
                                                    : isButton
                                                      ? "var(--adm-ink-2)"
                                                      : "var(--adm-ink)",
                                            }}
                                            title={node.row.name}
                                        >
                                            {node.row.name}
                                        </span>

                                        {isDir && <Tag tone="muted" appearance="soft" shape="rounded" size="sm" className="px-1 py-0 text-xs leading-tight">目录</Tag>}
                                        {node.row.generatedFromCategory && <Tag tone="primary" appearance="soft" shape="rounded" size="sm" className="px-1 py-0 text-xs leading-tight">分类</Tag>}
                                        {node.row.generatedFromCategory && node.row.status !== 1 && <Tag tone="muted" appearance="soft" shape="rounded" size="sm" className="px-1 py-0 text-xs leading-tight">停用</Tag>}

                                        <span
                                            className="ml-auto shrink-0 truncate pl-2 font-mono text-xs md:text-sm leading-tight"
                                            style={{color: "var(--adm-ink-3)", maxWidth: 190}}
                                            title={node.row.permissionKey ?? ""}
                                        >
                                            {node.row.permissionKey ?? ""}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter
                    className="shrink-0 border-t px-5 py-3 sm:justify-end"
                    style={{borderColor: "var(--adm-line)"}}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="admin-dialog-cancel"
                    >
                        {isSuperAdmin ? "关闭" : "取消"}
                    </button>

                    {/* superAdmin 没有保存按钮：它的权限由代码硬短路，写库没有意义 */}
                    {!isSuperAdmin && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="admin-dialog-submit"
                            data-testid="perm-save"
                        >
                            {saving ? "保存中…" : "保存"}
                        </button>
                    )}
                </DialogFooter>
            </AdminDialogContent>
        </Dialog>
    )
}
