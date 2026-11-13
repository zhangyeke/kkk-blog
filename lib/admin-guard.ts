import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { ActionError, AUTH_FAIL_CODE } from "@/lib/actionMessageBack"
import { auth } from "@/lib/auth"
import {
    actionKey,
    type AdminAction,
    type AdminPage,
    type DataScope,
    pageKey,
    parseRoles,
    resolveScope,
} from "@/lib/permissions"
import { getAllowedKeys, getPermissionRoles } from "@/lib/permission-store"

export type AdminUser = {
    id: string
    name: string
    email: string
    roles: string
    avatar: string | null
    /** 数据范围是否全量。由角色表的 scopeAll 决定（superAdmin 恒 true） */
    scopeAll: boolean
    /** 角色 code → 显示名，供侧栏 / 403 页显示自定义角色名 */
    roleNames?: Record<string, string>
}

/**
 * 计算数据范围开关。
 *
 * - superAdmin 恒 true（与 hasPermission 的硬短路一致）
 * - Role 表读到了 → 用户任一角色的 scopeAll 为 true 即 true
 * - Role 表为空 → 普通角色没有全量范围
 */
function resolveScopeAll(roles: string, roleRows: readonly { code: string; status: number; scopeAll: boolean }[]): boolean {
    const owned = parseRoles(roles)
    if (owned.includes("superAdmin")) return true
    if (roleRows.length === 0) return false
    return owned.some((code) => roleRows.some((row) => row.code === code && row.status === 1 && row.scopeAll))
}

/** 角色 code → 显示名。读不到角色表时返回 undefined，roleLabel 会退回内置中文名 */
function buildRoleNames(roleRows: readonly { code: string; name: string }[]): Record<string, string> | undefined {
    if (roleRows.length === 0) return undefined
    const names: Record<string, string> = {}
    for (const row of roleRows) names[row.code] = row.name
    return names
}

async function loadAdminUser(): Promise<AdminUser | null> {
    const session = await auth()
    const user = session?.user
    if (!user?.id) return null

    const roles = typeof (user as {roles?: unknown}).roles === "string"
        ? (user as {roles: string}).roles
        : "user"
    const roleRows = await getPermissionRoles()

    return {
        id: user.id,
        name: user.name ?? "未命名",
        email: user.email ?? "",
        roles,
        avatar: (user as { avatar?: string | null }).avatar ?? null,
        scopeAll: resolveScopeAll(roles, roleRows),
        roleNames: buildRoleNames(roleRows),
    }
}

/**
 * 读当前后台用户；未登录返回 null（不跳转，供 layout 做兜底渲染）。
 *
 * 用 React.cache 包住：layout、@sidebar、@topbar、forbidden 页各会调一次，
 * 不缓存的话同一请求里要重复 auth() + 查角色表 4 次。
 */
export const getAdminUser = cache(loadAdminUser)

/** 必须登录 */
export async function requireAdminUser(): Promise<AdminUser> {
    const user = await getAdminUser()
    if (!user) redirect("/login")
    return user
}

/**
 * 权限 key 的「宽」形态：AdminPage / AdminAction 的强类型值，或菜单表里读出来的
 * 原始 key 字符串（`page:users` / `action:menu:create`）。
 *
 * `(string & {})` 让字面量补全继续生效，同时不把调用点卡死在枚举上 ——
 * 后台可以在 AdminMenu 里新建 permissionKey，代码不可能提前知道全部取值。
 */
export type PermissionKey = AdminPage | AdminAction | (string & {})

/**
 * 页面级守卫。无权限时跳到 /admin/forbidden，而不是渲染空页面——
 * 空页面会让用户以为「功能坏了」，明确的 403 才是可理解的反馈。
 *
 * 优先走数据库菜单与授权；数据库不可用时由读取层回退到内置菜单和默认权限矩阵。
 * 用户角色取自当前登录会话，角色变更在会话更新后生效。
 * key 用 pageKey() 归一：传 `"roles"` 和传 `"page:roles"` 都能工作
 * （前者是代码里的 code，后者是菜单表里的 permissionKey 数据）。
 */
export async function requirePageAccess(page: PermissionKey): Promise<AdminUser> {
    const user = await requireAdminUser()
    const key = pageKey(page)
    const allowedKeys = await getAllowedKeys(user.roles)
    if (!allowedKeys.includes(key)) {
        // key 形如 page:users，encodeURIComponent 后是 page%3Ausers。
        redirect(`/admin/forbidden?key=${encodeURIComponent(key)}`)
    }
    return user
}

/**
 * 操作级守卫，给 server action 用。
 * 抛 ActionError 而不是 redirect——action 的调用方是表单/按钮，需要拿到错误信息。
 *
 * 与 requirePageAccess 一样接受宽形态 key，内部用 actionKey() 归一，
 * 所以 `"settings:update"` 与 `"action:settings:update"` 等价。
 */
export async function requireAction(action: PermissionKey): Promise<AdminUser> {
    const user = await requireAdminUser()
    const key = actionKey(action)
    const allowedKeys = await getAllowedKeys(user.roles)
    if (!allowedKeys.includes(key)) {
        throw new ActionError("没有该操作的权限", AUTH_FAIL_CODE)
    }
    return user
}

/** 数据范围：决定能查到哪些行。三态语义见 resolveScope */
export function scopeOf(user: AdminUser): DataScope {
    return resolveScope(user.roles, user.id, user.scopeAll)
}
