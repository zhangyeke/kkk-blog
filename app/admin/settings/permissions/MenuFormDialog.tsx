"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { AdminMenuRow, MenuType } from "@/lib/admin-menu-seed"
import { descendantIdsOf, indexByParent } from "@/lib/menu-tree"
import { cn } from "@/lib/utils"
import { createMenu, updateMenu } from "@/service/menu"
import { AdminDialogContent } from "../../components/AdminDialogContent"
import { FormField } from "../../components/FormField"
import { IconPickerField } from "@/components/k-view/Form/components/IconPickerField"
import { SegmentedControl } from "@/components/k-view/Form/components/SegmentedControl"
import { ADMIN_ICON_NAMES } from "@/lib/admin-icon-names"

/**
 * 菜单新增 / 编辑弹窗。
 *
 * ── 两条设计取舍 ──
 *
 * 1. **类型驱动字段**：dir / menu / button 三种节点拥有的字段完全不同
 *    （目录没有权限标识、按钮没有路由）。这里在「切类型」的那一刻就把不相关字段清空，
 *    而不是提交时再过滤 —— 否则用户切到按钮、再切回菜单，会看到上次填的 path 幽灵般回来。
 *
 * 2. **内置节点只读三件事**：type / permissionKey / parentId。
 *    这三者决定路由守卫与菜单表是否对得上，改了就静默失效；
 *    其余（名称、图标、排序、状态、显隐）属于「外观」，随便改。
 */

export type MenuFormDialogProps = {
    open: boolean
    /** null = 新建 */
    editing: AdminMenuRow | null
    /** 新建时的默认上级（从行内「新增」进来时为当前行 id） */
    defaultParentId: number | null
    /** 全量菜单行，用于「上级菜单」下拉与默认类型推断 */
    rows: AdminMenuRow[]
    onClose: () => void
}

type FormState = {
    parentId: number | null
    name: string
    type: MenuType
    icon: string
    path: string
    component: string
    componentName: string
    permissionKey: string
    /** 用字符串承接 input 值，提交时再转 number */
    sort: string
    status: 0 | 1
    visible: boolean
    alwaysShow: boolean
    keepAlive: boolean
}

const TYPE_OPTIONS: Array<{ value: MenuType; label: string }> = [
    { value: "dir", label: "目录" },
    { value: "menu", label: "菜单" },
    { value: "button", label: "按钮" },
]

/** 上级是目录 → 默认建菜单；上级是菜单 → 默认建按钮；顶级 → 默认建菜单 */
function defaultTypeFor(rows: AdminMenuRow[], parentId: number | null): MenuType {
    if (parentId === null) return "menu"
    const parent = rows.find((row) => row.id === parentId)
    if (!parent) return "menu"
    return parent.type === "menu" ? "button" : "menu"
}

function initialState(
    rows: AdminMenuRow[],
    editing: AdminMenuRow | null,
    defaultParentId: number | null,
): FormState {
    if (editing) {
        return {
            parentId: editing.parentId,
            name: editing.name,
            type: editing.type,
            icon: editing.icon ?? "",
            path: editing.path ?? "",
            component: editing.component ?? "",
            componentName: editing.componentName ?? "",
            permissionKey: editing.permissionKey ?? "",
            sort: String(editing.sort),
            status: editing.status === 0 ? 0 : 1,
            visible: editing.visible,
            alwaysShow: editing.alwaysShow,
            keepAlive: editing.keepAlive,
        }
    }

    return {
        parentId: defaultParentId,
        name: "",
        type: defaultTypeFor(rows, defaultParentId),
        icon: "",
        path: "",
        component: "",
        componentName: "",
        permissionKey: "",
        sort: "0",
        status: 1,
        visible: true,
        alwaysShow: false,
        keepAlive: false,
    }
}

/** 节点在树里的深度（顶级 = 0），用于上级下拉的缩进 */
function depthMap(rows: AdminMenuRow[]): Map<number, number> {
    const childrenOf = indexByParent(rows)
    const depths = new Map<number, number>()
    const walk = (parentId: number | null, depth: number): void => {
        for (const row of childrenOf.get(parentId) ?? []) {
            if (depths.has(row.id)) continue // 防御脏数据成环
            depths.set(row.id, depth)
            walk(row.id, depth + 1)
        }
    }
    walk(null, 0)
    return depths
}

export function MenuFormDialog({
    open,
    editing,
    defaultParentId,
    rows,
    onClose,
}: MenuFormDialogProps) {
    const router = useRouter()
    /*
     * 弹窗通过 Portal 挂到 body 上，**已经在 .admin-shell 之外**，
     * 拿不到那棵子树上的 --adm-* 变量。这里把 admin-shell 类与当前预设
     * 一起带到弹窗根节点上，主题 token 才能正常解析（否则整个弹窗是透明的）。
     */
    const [form, setForm] = React.useState<FormState>(() => initialState(rows, editing, defaultParentId))
    const [errors, setErrors] = React.useState<Record<string, string>>({})
    const [saving, setSaving] = React.useState(false)

    const isBuiltin = editing?.isBuiltin ?? false
    const formKey = `${editing?.id ?? "new"}:${defaultParentId ?? "root"}`
    const lastKey = React.useRef<string | null>(null)

    // 每次打开（或换了一条记录）都重置表单；同一表单内的重渲染不动用户输入
    React.useEffect(() => {
        if (!open) {
            lastKey.current = null
            return
        }
        if (lastKey.current === formKey) return
        lastKey.current = formKey
        setForm(initialState(rows, editing, defaultParentId))
        setErrors({})
    }, [open, formKey, rows, editing, defaultParentId])

    // 上级候选：不能选按钮（末级），也不能选自己 / 自己的后代（否则成环）
    const parentOptions = React.useMemo(() => {
        const excluded = editing ? new Set(descendantIdsOf(rows, editing.id)) : new Set<number>()
        const depths = depthMap(rows)
        return rows
            .filter((row) => row.type !== "button" && !excluded.has(row.id))
            .map((row) => ({
                id: row.id,
                label: `${"　".repeat(depths.get(row.id) ?? 0)}${row.type === "dir" ? "▸ " : "· "}${row.name}`,
            }))
    }, [rows, editing])

    const setField = React.useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({...prev, [key]: value}))
        setErrors((prev) => {
            if (!prev[key as string]) return prev
            const next = {...prev}
            delete next[key as string]
            return next
        })
    }, [])

    /** 切类型：立刻清掉新类型不存在的字段，避免脏值残留 */
    const changeType = React.useCallback((next: MenuType) => {
        setForm((prev) => {
            if (next === prev.type) return prev
            if (next === "button") {
                return {
                    ...prev,
                    type: next,
                    icon: "",
                    path: "",
                    component: "",
                    componentName: "",
                    alwaysShow: false,
                    keepAlive: false,
                    permissionKey: prev.permissionKey.startsWith("action:") ? prev.permissionKey : "",
                }
            }
            if (next === "dir") {
                return {
                    ...prev,
                    type: next,
                    component: "",
                    componentName: "",
                    keepAlive: false,
                    permissionKey: "",
                }
            }
            return {
                ...prev,
                type: next,
                alwaysShow: false,
                permissionKey: prev.permissionKey.startsWith("page:") ? prev.permissionKey : "",
            }
        })
        setErrors({})
    }, [])

    /** 前端校验：与 validators/menu.ts 的跨字段规则保持一致，先在前端拦一道 */
    const validate = React.useCallback((): Record<string, string> => {
        const next: Record<string, string> = {}
        if (form.name.trim() === "") next.name = "请填写菜单名称"
        else if (form.name.trim().length > 20) next.name = "最多 20 字"

        if (form.type !== "button" && form.path.trim() === "") next.path = "请填写路由地址"

        if (form.type === "menu") {
            const key = form.permissionKey.trim()
            if (key === "") next.permissionKey = "请填写权限标识"
            else if (!key.startsWith("page:")) next.permissionKey = "菜单权限标识必须以 page: 开头"
        }
        if (form.type === "button") {
            const key = form.permissionKey.trim()
            if (key === "") next.permissionKey = "请填写权限标识"
            else if (!key.startsWith("action:")) next.permissionKey = "按钮权限标识必须以 action: 开头"
        }

        const sort = Number(form.sort)
        if (form.sort.trim() === "" || !Number.isInteger(sort) || sort < 0) {
            next.sort = "排序需为 0 或正整数"
        }

        return next
    }, [form])

    const handleSubmit = React.useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault()
            if (saving) return

            const found = validate()
            if (Object.keys(found).length > 0) {
                setErrors(found)
                return
            }

            const sort = Number(form.sort)
            const payload = {
                parentId: form.parentId,
                name: form.name.trim(),
                type: form.type,
                icon: form.type === "button" ? null : form.icon.trim() || null,
                path: form.type === "button" ? null : form.path.trim() || null,
                component: form.type === "menu" ? form.component.trim() || null : null,
                componentName: form.type === "menu" ? form.componentName.trim() || null : null,
                permissionKey: form.type === "dir" ? null : form.permissionKey.trim() || null,
                sort,
                status: form.status,
                visible: form.visible,
                alwaysShow: form.type === "dir" ? form.alwaysShow : false,
                keepAlive: form.type === "menu" ? form.keepAlive : false,
            }

            setSaving(true)
            try {
                const result = editing
                    ? await updateMenu({id: editing.id, ...payload})
                    : await createMenu(payload)

                if (result.code === 200) {
                    toast.success(result.message || (editing ? "菜单已更新" : "菜单已创建"))
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
        },
        [editing, form, onClose, router, saving, validate],
    )

    const showPath = form.type !== "button"
    const showPermissionKey = form.type !== "dir"
    const showComponent = form.type === "menu"

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose()
            }}
        >
            <AdminDialogContent
                showCloseButton={false}
                className="w-[620px]"
            >
                <form onSubmit={handleSubmit} className="flex min-w-0 flex-col">
                    <DialogHeader
                        className="shrink-0 border-b px-5 py-3 text-left"
                        style={{borderColor: "var(--adm-line)"}}
                    >
                        <DialogTitle className="adm-serif text-base md:text-lg" style={{color: "var(--adm-ink)"}}>
                            {editing ? "修改菜单" : "新增菜单"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[min(70vh,calc(100dvh-8rem))] overflow-y-auto px-4 py-4 sm:px-5">
                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                            <FormField label="上级菜单" htmlFor="menu-form-parent">
                                <select
                                    id="menu-form-parent"
                                    value={form.parentId === null ? "" : String(form.parentId)}
                                    disabled={isBuiltin}
                                    onChange={(event) =>
                                        setField(
                                            "parentId",
                                            event.target.value === "" ? null : Number(event.target.value),
                                        )
                                    }
                                    className={cn(
                                        "h-8 w-full min-w-0 cursor-pointer rounded-md border bg-transparent px-2 text-sm md:text-base outline-none transition-colors",
                                        "focus:border-[var(--adm-c2)] disabled:cursor-not-allowed disabled:opacity-60",
                                    )}
                                    style={{
                                        borderColor: "var(--adm-line)",
                                        color: "var(--adm-ink)",
                                        background: "var(--adm-paper-2)",
                                    }}
                                >
                                    <option value="">顶级菜单</option>
                                    {parentOptions.map((option) => (
                                        <option key={option.id} value={String(option.id)}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="菜单名称" htmlFor="menu-form-name" required error={errors.name}>
                                <Input
                                    id="menu-form-name"
                                    value={form.name}
                                    onChange={(event) => setField("name", event.target.value)}
                                    placeholder="如 文章管理"
                                    className="admin-dialog-input"
                                    autoComplete="off"
                                    aria-invalid={Boolean(errors.name)}
                                />
                            </FormField>

                            <FormField label="菜单类型" required className="sm:col-span-2">
                                <SegmentedControl
                                    ariaLabel="菜单类型"
                                    options={TYPE_OPTIONS}
                                    value={form.type}
                                    onChange={changeType}
                                    disabled={isBuiltin}
                                    testIdPrefix="menu-type"
                                />
                            </FormField>

                            {form.type !== "button" && (
                                <FormField label="菜单图标" htmlFor="menu-form-icon">
                                    <IconPickerField
                                        id="menu-form-icon"
                                        value={form.icon}
                                        onChange={(next) => setField("icon", next)}
                                        options={ADMIN_ICON_NAMES}
                                        placeholder="图标名，如 posts"
                                        ariaLabel="选择菜单图标"
                                        emptyLabel="无图标"
                                        columns={6}
                                    />
                                </FormField>
                            )}

                            <FormField label="显示排序" htmlFor="menu-form-sort" required error={errors.sort}>
                                <Input
                                    id="menu-form-sort"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={form.sort}
                                    onChange={(event) => setField("sort", event.target.value)}
                                    className="admin-dialog-input"
                                />
                            </FormField>

                            {showPath && (
                                <FormField label="路由地址" htmlFor="menu-form-path" required error={errors.path}>
                                    <Input
                                        id="menu-form-path"
                                        value={form.path}
                                        onChange={(event) => setField("path", event.target.value)}
                                        placeholder="如 /admin/posts"
                                        className="admin-dialog-input"
                                        autoComplete="off"
                                        aria-invalid={Boolean(errors.path)}
                                    />
                                </FormField>
                            )}

                            {showPermissionKey && (
                                <FormField
                                    label="权限标识"
                                    htmlFor="menu-form-key"
                                    required
                                    error={errors.permissionKey}
                                >
                                    <Input
                                        id="menu-form-key"
                                        value={form.permissionKey}
                                        onChange={(event) => setField("permissionKey", event.target.value)}
                                        placeholder={form.type === "button" ? "action:menu:create" : "page:posts"}
                                        className="admin-dialog-input font-mono"
                                        autoComplete="off"
                                        disabled={isBuiltin}
                                        aria-invalid={Boolean(errors.permissionKey)}
                                    />
                                </FormField>
                            )}

                            {showComponent && (
                                <>
                                    <FormField label="组件地址" htmlFor="menu-form-component">
                                        <Input
                                            id="menu-form-component"
                                            value={form.component}
                                            onChange={(event) => setField("component", event.target.value)}
                                            placeholder="app/admin/posts/page.tsx"
                                            className="admin-dialog-input font-mono"
                                            autoComplete="off"
                                        />
                                    </FormField>

                                    <FormField label="组件名字" htmlFor="menu-form-component-name">
                                        <Input
                                            id="menu-form-component-name"
                                            value={form.componentName}
                                            onChange={(event) => setField("componentName", event.target.value)}
                                            placeholder="posts"
                                            className="admin-dialog-input font-mono"
                                            autoComplete="off"
                                        />
                                    </FormField>
                                </>
                            )}

                            <FormField label="菜单状态" required>
                                <SegmentedControl
                                    ariaLabel="菜单状态"
                                    options={[
                                        {value: 1, label: "开启"},
                                        {value: 0, label: "关闭"},
                                    ]}
                                    value={form.status}
                                    onChange={(next) => setField("status", next === 0 ? 0 : 1)}
                                    testIdPrefix="menu-status"
                                />
                            </FormField>

                            <FormField label="显示状态">
                                <SegmentedControl
                                    ariaLabel="显示状态"
                                    options={[
                                        {value: 1, label: "显示"},
                                        {value: 0, label: "隐藏"},
                                    ]}
                                    value={form.visible ? 1 : 0}
                                    onChange={(next) => setField("visible", next === 1)}
                                    testIdPrefix="menu-visible"
                                />
                            </FormField>

                            {form.type === "dir" && (
                                <FormField label="总是显示">
                                    <SegmentedControl
                                        ariaLabel="总是显示"
                                        options={[
                                            {value: 1, label: "总是"},
                                            {value: 0, label: "不是"},
                                        ]}
                                        value={form.alwaysShow ? 1 : 0}
                                        onChange={(next) => setField("alwaysShow", next === 1)}
                                        testIdPrefix="menu-always-show"
                                    />
                                </FormField>
                            )}

                            {form.type === "menu" && (
                                <FormField label="缓存状态">
                                    <SegmentedControl
                                        ariaLabel="缓存状态"
                                        options={[
                                            {value: 1, label: "缓存"},
                                            {value: 0, label: "不缓存"},
                                        ]}
                                        value={form.keepAlive ? 1 : 0}
                                        onChange={(next) => setField("keepAlive", next === 1)}
                                        testIdPrefix="menu-keep-alive"
                                    />
                                </FormField>
                            )}
                        </div>

                        {isBuiltin && (
                            <p
                                className="mt-3 flex items-center gap-1.5 text-xs md:text-sm leading-tight"
                                style={{color: "var(--adm-ink-3)"}}
                            >
                                <Info className="size-3 shrink-0"/>
                                内置节点不可修改类型、权限标识与上级
                            </p>
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
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="admin-dialog-submit"
                        >
                            {saving ? "保存中…" : "确定"}
                        </button>
                    </DialogFooter>
                </form>
            </AdminDialogContent>
        </Dialog>
    )
}
