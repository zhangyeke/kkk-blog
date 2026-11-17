/**
 * 后台权限模型。
 *
 * 生产授权以数据库的 AdminMenu / Role / RolePermission 为准。
 * 本文件提供类型、key 归一化和内置默认权限矩阵；数据库权限不可用或尚无授权数据时，
 * 服务端守卫使用默认矩阵与内置菜单种子兜底。
 *
 * 权限分三层，缺一不可：
 * 1. 页面级 —— 路由守卫（proxy.ts / lib/admin/guard.ts 的 requirePageAccess）
 * 2. 按钮级 —— withPermission / <Can>（components/admin/with-permission.tsx）
 * 3. 数据级 —— 各领域 service 按 scope 过滤（前两层都是"看得到界面"，这层才是"拿得到数据"）
 *
 * 静态页面/动作策略同时用于构造 DEFAULT_PERMISSION_MATRIX，作为数据库不可用时的兜底。
 */

/* The shared enum catalog is dependency-free; only the menu tree's matrix type is erased. */
import { BUILTIN_ROLE_CODES } from "@/assets/enumerate/global"
import type { AdminAction, AdminPage, BuiltinRole } from "@/assets/enumerate/global"

/** Role codes include built-ins while retaining completion for custom database roles. */
export type Role = BuiltinRole | (string & {})
/** 内置角色顺序（菜单列、权限矩阵列都按这个顺序渲染） */
export const BUILTIN_ROLES: readonly BuiltinRole[] = BUILTIN_ROLE_CODES

/** 内置角色的中文显示名。自定义角色走 roleLabel 的 names 参数 */
export const BUILTIN_ROLE_LABELS: Record<BuiltinRole, string> = {
    superAdmin: "超级管理员",
    admin: "管理员",
    user: "普通用户",
}

/* ------------------------------------------------------------------ *
 * 权限项字典
 * ------------------------------------------------------------------ */

/**
 * 单个权限项。
 * `key` 是落库用的字符串（page:posts / action:post:create），
 * `code` 是代码里用的强类型值（posts / post:create），两者一一对应。
 */
export type PermissionItem<K extends string = string> = {
    /** page:posts / action:post:create */
    key: string
    /** AdminPage 或 AdminAction 原始值 */
    code: K
    /** 文章管理 / 新建文章 */
    label: string
    /** 矩阵分组表头：页面访问 / 文章 / 文章分类 / 用户 / 设置 */
    group: string
    /** 动作归属页面（分组用） */
    parent?: AdminPage
    order: number
}

/**
 * 拼 page key。集中一处，避免各处手写模板字符串写错。
 *
 * 容错：传入值已经带 `page:` 前缀时原样返回。
 * 菜单树里 permissionKey 是**数据**（从 DB 读出来就是 `page:posts`），
 * 而代码里习惯传 code（`posts`），两种形态都要能用 ——
 * `pageKey("roles")` 与 `pageKey("page:roles")` 等价。
 */
export function pageKey(page: AdminPage | (string & {})): string {
    return page.startsWith("page:") ? page : `page:${page}`
}

/**
 * 拼 action key。
 *
 * 注意这里必须用**前缀**判断，不能像 page 那样用「含不含冒号」：
 * action 的 code 本身就带冒号（`post:create`），
 * 用「含冒号就原样返回」会把 `actionKey("post:create")` 算成 `post:create`，
 * 整个动作 key 字典会当场错位。
 */
export function actionKey(action: AdminAction | (string & {})): string {
    return action.startsWith("action:") ? action : `action:${action}`
}

/**
 * 页面访问项（10 项，全部归在「页面访问」组）。
 *
 * @deprecated 静态兼容策略，不作为生产授权来源。
 * 运行时「有哪些页面权限」由 AdminMenu 表决定，见 lib/admin/menu-store.ts。
 */
export const PAGE_ITEMS: readonly PermissionItem<AdminPage>[] = [
    {key: pageKey("dashboard"), code: "dashboard", label: "概览", group: "页面访问", order: 1},
    {key: pageKey("posts"), code: "posts", label: "文章管理", group: "页面访问", order: 2},
    {key: pageKey("postCategories"), code: "postCategories", label: "文章分类", group: "页面访问", order: 3},
    {key: pageKey("bookmarks"), code: "bookmarks", label: "书签", group: "页面访问", order: 4},
    {key: pageKey("bookmarkCategories"), code: "bookmarkCategories", label: "书签分类", group: "页面访问", order: 5},
    {key: pageKey("footprints"), code: "footprints", label: "足迹", group: "页面访问", order: 5},
    {key: pageKey("users"), code: "users", label: "用户", group: "页面访问", order: 6},
    {key: pageKey("roles"), code: "roles", label: "角色管理", group: "页面访问", order: 7},
    {key: pageKey("settings"), code: "settings", label: "设置", group: "页面访问", order: 8},
    {key: pageKey("menus"), code: "menus", label: "权限管理", group: "页面访问", order: 10},
]

/**
 * 按钮动作项，按归属页面分组。
 *
 * @deprecated 静态兼容策略，不作为生产授权来源。
 * 运行时「有哪些动作权限」由 AdminMenu 表的 button 行决定。
 */
export const ACTION_ITEMS: readonly PermissionItem<AdminAction>[] = [
    {key: actionKey("post:create"), code: "post:create", label: "新建文章", group: "文章", parent: "posts", order: 1},
    {key: actionKey("post:update"), code: "post:update", label: "编辑文章", group: "文章", parent: "posts", order: 2},
    {key: actionKey("post:delete"), code: "post:delete", label: "删除文章", group: "文章", parent: "posts", order: 3},
    {
        key: actionKey("postCategory:create"),
        code: "postCategory:create",
        label: "新建分类",
        group: "文章分类",
        parent: "postCategories",
        order: 4,
    },
    {
        key: actionKey("postCategory:update"),
        code: "postCategory:update",
        label: "编辑分类",
        group: "文章分类",
        parent: "postCategories",
        order: 5,
    },
    {
        key: actionKey("postCategory:delete"),
        code: "postCategory:delete",
        label: "删除分类",
        group: "文章分类",
        parent: "postCategories",
        order: 6,
    },
    {
        key: actionKey("bookmark:create"),
        code: "bookmark:create",
        label: "新建书签",
        group: "书签",
        parent: "bookmarks",
        order: 7,
    },
    {
        key: actionKey("bookmark:delete"),
        code: "bookmark:delete",
        label: "删除书签",
        group: "书签",
        parent: "bookmarks",
        order: 8,
    },
    {key: actionKey("bookmark:update"), code: "bookmark:update", label: "编辑书签", group: "书签", parent: "bookmarks", order: 9},
    {key: actionKey("bookmarkCategory:create"), code: "bookmarkCategory:create", label: "新建书签分类", group: "书签分类", parent: "bookmarkCategories", order: 10},
    {key: actionKey("bookmarkCategory:update"), code: "bookmarkCategory:update", label: "编辑书签分类", group: "书签分类", parent: "bookmarkCategories", order: 11},
    {key: actionKey("bookmarkCategory:delete"), code: "bookmarkCategory:delete", label: "删除书签分类", group: "书签分类", parent: "bookmarkCategories", order: 12},
    {
        key: actionKey("footprint:create"),
        code: "footprint:create",
        label: "新建足迹",
        group: "足迹",
        parent: "footprints",
        order: 13,
    },
    {
        key: actionKey("footprint:update"),
        code: "footprint:update",
        label: "编辑足迹",
        group: "足迹",
        parent: "footprints",
        order: 14,
    },
    {
        key: actionKey("footprint:delete"),
        code: "footprint:delete",
        label: "删除足迹",
        group: "足迹",
        parent: "footprints",
        order: 15,
    },
    {key: actionKey("user:manage"), code: "user:manage", label: "管理用户", group: "用户", parent: "users", order: 16},
    {
        key: actionKey("settings:update"),
        code: "settings:update",
        label: "修改设置",
        group: "设置",
        parent: "settings",
        order: 17,
    },
]

/** 内置权限 key：10 页面 + 17 动作 = 27 */
export const ALL_PERMISSION_KEYS: readonly string[] = [
    ...PAGE_ITEMS.map((item) => item.key),
    ...ACTION_ITEMS.map((item) => item.key),
]

/**
 * 历史内置权限 key 字典，仅用于静态兼容策略和迁移参考，不参与运行时授权。
 */
export const BUILTIN_KEY_SET: ReadonlySet<string> = new Set(ALL_PERMISSION_KEYS)

/**
 * @deprecated 兼容旧引用；不是运行时权限全集。
 */
export const PERMISSION_KEY_SET: ReadonlySet<string> = BUILTIN_KEY_SET

/* ------------------------------------------------------------------ *
 * 静态兼容策略（生产鉴权不读取）
 * ------------------------------------------------------------------ */

const ALL: Role[] = ["superAdmin", "admin", "user"]
const STAFF: Role[] = ["superAdmin", "admin"]
const OWNER: Role[] = ["superAdmin"]

/** 页面访问矩阵（内置默认策略） */
export const PAGE_ACCESS: Record<AdminPage, Role[]> = {
    dashboard: ALL,
    posts: ALL,
    postCategories: ALL,
    bookmarks: STAFF,
    bookmarkCategories: STAFF,
    footprints: STAFF,
    users: OWNER,
    roles: OWNER,
    settings: OWNER,
    menus: OWNER,
}

/** 按钮动作矩阵（内置默认策略） */
export const ACTION_ACCESS: Record<AdminAction, Role[]> = {
    "post:create": ALL,
    "post:update": ALL,
    "post:delete": ALL,
    "postCategory:create": STAFF,
    "postCategory:update": STAFF,
    "postCategory:delete": STAFF,
    "bookmark:create": STAFF,
    "bookmark:update": STAFF,
    "bookmark:delete": STAFF,
    "bookmarkCategory:create": STAFF,
    "bookmarkCategory:update": STAFF,
    "bookmarkCategory:delete": STAFF,
    "footprint:create": STAFF,
    "footprint:update": STAFF,
    "footprint:delete": STAFF,
    "user:manage": OWNER,
    "settings:update": OWNER,
}

/* ------------------------------------------------------------------ *
 * 规范形式：roleCode → permissionKey[]
 * ------------------------------------------------------------------ */

/** 角色 → 权限 key 列表。DB 读出来后先归一到这个形状，判定层只认它 */
export type PermissionMatrix = Record<string, string[]>

/** 数据库权限表不可用或尚无授权数据时使用的内置兜底矩阵。 */
export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = buildDefaultMatrix()

function buildDefaultMatrix(): PermissionMatrix {
    const matrix: PermissionMatrix = {}
    for (const role of BUILTIN_ROLES) {
        const keys: string[] = []
        for (const item of PAGE_ITEMS) {
            if (PAGE_ACCESS[item.code].includes(role)) keys.push(item.key)
        }
        for (const item of ACTION_ITEMS) {
            if (ACTION_ACCESS[item.code].includes(role)) keys.push(item.key)
        }
        matrix[role] = keys
    }
    // The personal profile entry remains available to ordinary signed-in users
    // when the permission tables are empty or temporarily unavailable.
    matrix.user = [...(matrix.user ?? []), "blog:account:home"]
    return matrix
}

/**
 * `roles` 在库里是 String，允许用逗号承载多角色（如 "admin,user"）。
 * 拆开后做并集判断，任一命中即通过。
 */
export function parseRoles(raw: string | null | undefined): Role[] {
    if (!raw) return ["user"]
    const list = raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean) as Role[]
    return list.length > 0 ? list : ["user"]
}

/** 是否拥有 allow 里的任一角色（角色维度，不看权限 key） */
export function hasAnyRole(roles: string | null | undefined, allow: readonly Role[]): boolean {
    const owned = parseRoles(roles)
    return owned.some((role) => allow.includes(role))
}

/**
 * 权限判定的唯一入口。
 *
 * superAdmin 在这里**硬短路**：不管矩阵里有没有它的授权行，一律放行。
 * 这是「超管权限不可剥夺」的唯一保证 —— 所以 DB 里 superAdmin 一行权限都不插，
 * 也不允许后台把它改没。
 */
export function hasPermission(
    matrix: PermissionMatrix,
    roles: string | null | undefined,
    key: string,
): boolean {
    const owned = parseRoles(roles)
    if (owned.includes("superAdmin")) return true
    return owned.some((code) => matrix[code]?.includes(key) ?? false)
}

/** 页面级判定（走矩阵） */
export function canAccessPageWith(
    matrix: PermissionMatrix,
    roles: string | null | undefined,
    page: AdminPage,
): boolean {
    return hasPermission(matrix, roles, pageKey(page))
}

/** 按钮级判定（走矩阵） */
export function canPerformWith(
    matrix: PermissionMatrix,
    roles: string | null | undefined,
    action: AdminAction,
): boolean {
    return hasPermission(matrix, roles, actionKey(action))
}

/**
 * 当前角色能用的**全部权限 key**（页面 + 动作 + 菜单表里的自定义 key）。
 *
 * - superAdmin：直接返回 allKeys 全集（与 hasPermission 的硬短路同源，
 *   不依赖 DB 里是否有它的授权行）；
 * - 其它角色：把名下所有角色的授权取并集，再按 allKeys 过滤 ——
 *   过滤是为了丢弃「字典里已经没有的旧 key」，避免脏授权漏到前端；
 *   顺序跟随 allKeys（调用方传入顺序即展示顺序，结果稳定可复现）。
 */
export function resolveAllowedKeys(
    matrix: PermissionMatrix,
    roles: string | null | undefined,
    allKeys: readonly string[],
): string[] {
    const owned = parseRoles(roles)
    if (owned.includes("superAdmin")) return [...allKeys]

    const granted = new Set<string>()
    for (const code of owned) {
        for (const key of matrix[code] ?? []) granted.add(key)
    }
    return allKeys.filter((key) => granted.has(key))
}

/* ------------------------------------------------------------------ *
 * 旧静态 API（兼容用途，不用于生产守卫）
 * ------------------------------------------------------------------ */

/** 兼容用页面级静态判定；生产代码请使用 requirePageAccess。 */
export function canAccessPage(roles: string | null | undefined, page: AdminPage): boolean {
    return hasAnyRole(roles, PAGE_ACCESS[page])
}

/** 兼容用按钮级静态判定；生产代码请使用 requireAction。 */
export function canPerform(roles: string | null | undefined, action: AdminAction): boolean {
    return hasAnyRole(roles, ACTION_ACCESS[action])
}

/**
 * 数据范围：决定「能查到多少行」。
 *
 * 第三个参数是角色表里的 scopeAll，三态语义严格区分：
 * - `true`      → 全量（角色表显式授予）
 * - `false`     → 仅自己（角色表显式关闭），**不回落**到内置策略 ——
 *                 否则「管理员但被收回全量」这种配置会失效
 * - `undefined` → 旧行为：按内置策略判断（STAFF 全量），保证老调用点不变
 *
 * superAdmin 恒全量，与 hasPermission 的硬短路保持一致。
 */
export type DataScope = { all: boolean; userId: string }

export function resolveScope(
    roles: string | null | undefined,
    userId: string,
    scopeAll?: boolean,
): DataScope {
    const owned = parseRoles(roles)
    if (owned.includes("superAdmin")) return {all: true, userId} // 超管恒全量
    if (scopeAll === true) return {all: true, userId}
    if (scopeAll === false) return {all: false, userId} // 显式关闭，不回落
    return {all: hasAnyRole(roles, STAFF), userId} // undefined → 旧行为
}

/* ------------------------------------------------------------------ *
 * 展示
 * ------------------------------------------------------------------ */

/**
 * 把 "admin,user" 转成 "管理员、普通用户"。
 * names 传自定义角色显示名映射，缺省用内置中文名；未知 code 原样显示。
 */
export function roleLabel(
    roles: string | null | undefined,
    names?: Record<string, string>,
): string {
    const owned = Array.from(new Set(parseRoles(roles)))
    return owned
        .map((code) => names?.[code] ?? BUILTIN_ROLE_LABELS[code as BuiltinRole] ?? code)
        .join("、")
}
