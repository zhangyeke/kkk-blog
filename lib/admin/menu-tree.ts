/**
 * 后台菜单树的纯函数层（Edge 安全，无 IO、无 Prisma、无 server-only）。
 *
 * 这里只做「行 → 树 → 导航 / 路径索引」的纯变换，任何地方都能 import：
 * - RSC 里由 lib/admin/menu-store 喂 DB 行进来；
 * - 中间件（Edge）里由快照接口拿到的 path 索引直接用；
 * - 单元测试里直接喂 ADMIN_MENU_SEED。
 *
 * 之所以把「路径 → 权限 key」的匹配也放在这里，是因为它必须**同时**被
 * Node 侧（页面守卫）和 Edge 侧（proxy.ts）使用，两边共用同一份实现才不会出现
 * 「中间件放行、页面拦截」这种割裂。
 */

import {hasPermission, type PermissionMatrix} from "@/lib/admin/permissions"
import type {AdminMenuRow, MenuType} from "@/lib/admin/menu-seed"

/** 树节点：行 + 深度（一级 = 1） + 子节点 */
export type AdminMenuNode = {
    row: AdminMenuRow
    depth: number
    children: AdminMenuNode[]
}

/**
 * 侧栏导航项（渲染用）。
 *
 * 与 lib/admin/permissions.ts 里那个旧的 AdminNavItem **不是同一个东西**：
 * 旧的是写死的静态表，这里的由菜单树 + 权限矩阵实时算出来。
 */
export type AdminNavItem = {
    /** `menu:${id}`，稳定且唯一 */
    key: string
    label: string
    /** dir = 首个可见子项的 path；无子项 = ""；menu = row.path ?? "" */
    href: string
    icon: string | null
    /** row.sort */
    order: number
    children?: AdminNavItem[]
}

/** 路径鉴权索引项。depth 用于「深路径优先」，避免 /admin 吞掉 /admin/whatever */
export type PathPermissionEntry = {
    path: string
    key: string
    depth: number
}

/** 参与导航的节点类型（button 只做鉴权，不进导航） */
const NAV_TYPES: readonly MenuType[] = ["dir", "menu"]

/** 同级排序：sort 升序，id 升序兜底（保证顺序稳定、可复现） */
function compareRows(a: AdminMenuRow, b: AdminMenuRow): number {
    if (a.sort !== b.sort) return a.sort - b.sort
    return a.id - b.id
}

/** 统一 path 形态：去首尾空白、去掉末尾多余斜杠；空串表示「没有路径」 */
function normalizePath(path: string | null | undefined): string {
    if (!path) return ""
    const trimmed = path.trim()
    if (!trimmed) return ""
    if (trimmed === "/") return "/"
    return trimmed.replace(/\/+$/, "")
}

/** pathname 归一：去掉末尾斜杠，"/" 与 "" 都归一成 "/" */
function normalizePathname(pathname: string): string {
    const trimmed = pathname.trim()
    if (trimmed.length <= 1) return "/"
    return trimmed.replace(/\/+$/, "")
}

/**
 * 行 → 树。
 *
 * 规则：
 * - 同级按 `sort ASC, id ASC` 排序；
 * - depth 由树结构决定（一级 = 1），**不是** sort 或 id；
 * - 父节点缺失（脏数据 / 父行被物理删掉但外键没级联）时按根节点处理，
 *   宁可多显示一项，也不要静默丢行导致「有权限但看不到菜单」。
 */
export function buildMenuTree(rows: readonly AdminMenuRow[]): AdminMenuNode[] {
    const nodes = new Map<number, AdminMenuNode>()
    for (const row of rows) {
        // 主键重复的脏数据只保留第一条，避免同 id 出现两个节点
        if (nodes.has(row.id)) continue
        nodes.set(row.id, {row, depth: 0, children: []})
    }

    const roots: AdminMenuNode[] = []
    for (const node of nodes.values()) {
        const parentId = node.row.parentId
        const parent = parentId == null ? undefined : nodes.get(parentId)
        if (parent && parent !== node) {
            parent.children.push(node)
        } else {
            roots.push(node)
        }
    }

    // 自顶向下赋值 depth。seen 防御脏数据成环（A→B→A）导致的无限递归
    const seen = new Set<number>()
    const assignDepth = (list: AdminMenuNode[], depth: number): void => {
        list.sort((a, b) => compareRows(a.row, b.row))
        for (const node of list) {
            if (seen.has(node.row.id)) continue
            seen.add(node.row.id)
            node.depth = depth
            assignDepth(node.children, depth + 1)
        }
    }
    assignDepth(roots, 1)

    return roots
}

/** 深度优先拍平（先序：父在子前），索引构建与遍历都用它 */
export function flattenTree(tree: readonly AdminMenuNode[]): AdminMenuNode[] {
    const out: AdminMenuNode[] = []
    const walk = (list: readonly AdminMenuNode[]): void => {
        for (const node of list) {
            out.push(node)
            walk(node.children)
        }
    }
    walk(tree)
    return out
}

/**
 * 父 id → 子行（同级已按 `sort ASC, id ASC` 排好）。
 *
 * 三个消费者共用同一份实现：菜单管理列表（建树渲染）、表单的「上级菜单」下拉
 * （缩进 + 排除后代）、服务端的子树收集（删除 / 环检测）。
 * 父行缺失（脏数据）时归到 `null` 桶按根节点处理 —— 与 buildMenuTree 的兜底一致。
 */
export function indexByParent(rows: readonly AdminMenuRow[]): Map<number | null, AdminMenuRow[]> {
    const ids = new Set(rows.map((row) => row.id))
    const map = new Map<number | null, AdminMenuRow[]>()

    for (const row of rows) {
        const parentId = row.parentId != null && ids.has(row.parentId) ? row.parentId : null
        const bucket = map.get(parentId)
        if (bucket) bucket.push(row)
        else map.set(parentId, [row])
    }

    for (const bucket of map.values()) bucket.sort(compareRows)
    return map
}

/**
 * 某节点的整棵子树 id（含自身，深度优先）。
 *
 * `seen` 兜住脏数据成环（A→B→A），否则会无限压栈。
 */
export function descendantIdsOf(rows: readonly AdminMenuRow[], rootId: number): number[] {
    const childrenOf = indexByParent(rows)
    const ids: number[] = []
    const seen = new Set<number>()
    const stack: number[] = [rootId]

    while (stack.length > 0) {
        const current = stack.pop()
        if (current === undefined || seen.has(current)) continue
        seen.add(current)
        ids.push(current)
        for (const child of childrenOf.get(current) ?? []) stack.push(child.id)
    }

    return ids
}

/**
 * 构建「路径 → 权限 key」索引。
 *
 * 规则（顺序即优先级，改之前先想清楚）：
 * 1. 只收 `type ∈ {dir, menu}` ∧ `status === 1` ∧ `path` 非空；
 * 2. 同一 path 出现多行时只保留 `type === 'menu'` 那行 ——
 *    目录只是分组容器（`/admin/posts` 既是目录「文章管理」的入口，也是菜单「文章」的路径），
 *    真正产生鉴权项的是菜单；
 * 3. 目录没有 permissionKey，因此**不产生鉴权项**（跳过）；
 * 4. 输出按 `depth DESC, path.length DESC` 排序：深路径优先、长路径优先，
 *    这样 `/admin/posts/categories` 一定排在 `/admin/posts` 前面被匹配到。
 */
export function buildPathIndex(tree: readonly AdminMenuNode[]): PathPermissionEntry[] {
    const picked = new Map<string, AdminMenuNode>()

    for (const node of flattenTree(tree)) {
        const {row} = node
        if (!NAV_TYPES.includes(row.type)) continue
        if (row.status !== 1) continue
        const path = normalizePath(row.path)
        if (!path) continue

        const existing = picked.get(path)
        if (!existing) {
            picked.set(path, node)
            continue
        }
        // 同 path：菜单覆盖目录（目录不产生鉴权项）
        if (existing.row.type === "dir" && row.type === "menu") {
            picked.set(path, node)
        }
    }

    const entries: PathPermissionEntry[] = []
    for (const [path, node] of picked) {
        const key = node.row.permissionKey
        // 目录 permissionKey 为 null → 不产生鉴权项
        if (!key) continue
        entries.push({path, key, depth: node.depth})
    }

    entries.sort((a, b) => {
        if (a.depth !== b.depth) return b.depth - a.depth
        return b.path.length - a.path.length
    })

    return entries
}

/**
 * pathname → 需要哪个权限 key（null 表示这条路由不做页面级鉴权）。
 *
 * 关键的一条：`depth === 1` 的项**只接受精确匹配**。
 * 因为一级菜单 `/admin`（概览）如果也走前缀匹配，`/admin/whatever`
 * 就会被吞成 `page:dashboard`，普通用户硬闯任何未知后台路由都会被放行到概览，
 * 那等于把鉴权做没了。
 *
 * 白名单：403 页本身必须放行，否则会重定向到自己形成死循环。
 */
export function matchRequiredKey(
    pathname: string,
    index: readonly PathPermissionEntry[],
): string | null {
    const clean = normalizePathname(pathname)
    if (!clean.startsWith("/admin")) return null
    if (clean.startsWith("/admin/forbidden")) return null

    for (const entry of index) {
        if (entry.depth <= 1) {
            if (clean === entry.path) return entry.key
            continue
        }
        if (clean === entry.path || clean.startsWith(`${entry.path}/`)) {
            return entry.key
        }
    }

    return null
}

/** 单个节点 → 导航项；不可见 / 无权限返回 null */
function toNavItem(
    node: AdminMenuNode,
    matrix: PermissionMatrix,
    roles: string | null | undefined,
): AdminNavItem | null {
    const {row} = node
    if (!NAV_TYPES.includes(row.type)) return null
    if (row.status !== 1) return null
    if (!row.visible) return null

    if (row.type === "menu") {
        // 菜单：permissionKey 为空 → 人人可见；否则必须持有该 key
        const key = row.permissionKey
        if (key && !hasPermission(matrix, roles, key)) return null
        return {
            key: `menu:${row.id}`,
            label: row.name,
            href: row.path ?? "",
            icon: row.icon ?? null,
            order: row.sort,
        }
    }

    /*
     * 目录：不看自己的 permissionKey（它是纯分组），只看子节点存活情况。
     * 一个子节点都活不下来 → 整个目录不渲染（否则侧栏会出现点进去全是 403 的空壳）。
     */
    const children: AdminNavItem[] = []
    for (const child of node.children) {
        const item = toNavItem(child, matrix, roles)
        if (item) children.push(item)
    }
    if (children.length === 0) return null

    // 稳定排序（V8 的 sort 是稳定排序），order 相同就保持树里的 id 顺序
    children.sort((a, b) => a.order - b.order)

    // dir 自身没有可用 href，用第一个有 href 的子项顶上（侧栏父项可点击）
    const firstHref = children.find((child) => child.href !== "")?.href ?? ""

    return {
        key: `menu:${row.id}`,
        label: row.name,
        href: firstHref,
        icon: row.icon ?? null,
        order: row.sort,
        children,
    }
}

/**
 * 按权限矩阵过滤菜单树，产出侧栏导航。
 *
 * - 只保留 `type ∈ {dir, menu}` ∧ `status === 1` ∧ `visible === true`；
 * - menu 看自己的 permissionKey；
 * - dir 递归过滤子节点，`children.length > 0` 才保留；
 * - 同级按 `sort ASC, id ASC`（树已排好序，这里只做稳定兜底）。
 */
export function filterNav(
    tree: readonly AdminMenuNode[],
    matrix: PermissionMatrix,
    roles: string | null | undefined,
): AdminNavItem[] {
    const result: AdminNavItem[] = []
    for (const node of tree) {
        const item = toNavItem(node, matrix, roles)
        if (item) result.push(item)
    }
    result.sort((a, b) => a.order - b.order)
    return result
}

/**
 * 当前路径命中的导航节点，供面包屑显示设置下的当前子菜单。
 *
 * 匹配优先级：二级项精确命中 → 一级项精确命中 → 最长 href 前缀命中（详情页）。
 * 全部未命中返回 `{root: null, child: null}`。
 */
export function breadcrumbFor(
    pathname: string,
    nav: readonly AdminNavItem[],
): {root: AdminNavItem | null; child: AdminNavItem | null} {
    const clean = normalizePathname(pathname)

    for (const root of nav) {
        for (const child of root.children ?? []) {
            if (child.href !== "" && child.href === clean) return {root, child}
        }
    }

    for (const root of nav) {
        if (root.href !== "" && root.href === clean) return {root, child: null}
    }

    let best: {root: AdminNavItem; child: AdminNavItem | null; length: number} | null = null
    for (const root of nav) {
        const candidates: AdminNavItem[] = [root, ...(root.children ?? [])]
        for (const item of candidates) {
            if (item.href === "") continue
            if (clean !== item.href && !clean.startsWith(`${item.href}/`)) continue
            if (best && best.length >= item.href.length) continue
            best = {
                root,
                child: item === root ? null : item,
                length: item.href.length,
            }
        }
    }

    return best ? {root: best.root, child: best.child} : {root: null, child: null}
}
