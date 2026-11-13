/**
 * 后台菜单树的读取层（服务端专用）。
 *
 * ── 缓存策略：仅使用 React.cache 请求内去重 ──
 *
 * `getMenuRows` / `getMenuTree` / `getNavForUser` / `getPermissionKeySet` 都服务于
 * **RSC 渲染**（layout / @sidebar / 页面守卫）。后台改完菜单或权限必须「刷新就生效」，
 * 所以只能用 React.cache：请求级 memo，一次请求内多个调用点共用一次查库，
 * 请求结束即失效，没有 TTL。
 *
 * 侧栏和菜单管理页优先读取 AdminMenu 表；数据库还未建表、连接失败或菜单表为空时，
 * 使用与 SQL 种子一致的 ADMIN_MENU_SEED，保证后台导航仍可用。
 */

import "server-only"

import { cache } from "react"

import { ADMIN_MENU_SEED, type AdminMenuRow, type MenuType } from "@/lib/admin-menu-seed"
import { type AdminMenuNode, type AdminNavItem, buildMenuTree, filterNav } from "@/lib/menu-tree"
import { getPermissionMatrix, getPermissionRoles } from "@/lib/permission-store"
import prisma from "@/lib/prisma"
import { parseRoles } from "@/lib/permissions"

/** 合法的节点类型集合，用于把 DB 里的 String 收窄成 MenuType（脏数据兜底为 menu） */
const MENU_TYPE_SET: ReadonlySet<string> = new Set<MenuType>(["dir", "menu", "button"])

/** Prisma 查询出来的行（只声明用得到的字段，避免把 createdAt/updatedAt 带出去） */
type AdminMenuRecord = {
  id: number
  parentId: number | null
  name: string
  type: string
  icon: string | null
  path: string | null
  component: string | null
  componentName: string | null
  permissionKey: string | null
  sort: number
  status: number
  visible: boolean
  alwaysShow: boolean
  keepAlive: boolean
  isBuiltin: boolean
}

/** DB 行 → AdminMenuRow（剥掉时间字段，收窄 type） */
function toRow(record: AdminMenuRecord): AdminMenuRow {
  return {
    id: record.id,
    parentId: record.parentId,
    name: record.name,
    type: MENU_TYPE_SET.has(record.type) ? (record.type as MenuType) : "menu",
    icon: record.icon,
    path: record.path,
    component: record.component,
    componentName: record.componentName,
    permissionKey: record.permissionKey,
    sort: record.sort,
    status: record.status,
    visible: record.visible,
    alwaysShow: record.alwaysShow,
    keepAlive: record.keepAlive,
    isBuiltin: record.isBuiltin,
  }
}

/** 直接读取数据库菜单；菜单管理写操作使用它，避免把种子数据当成数据库现状。 */
export async function loadMenuRowsRequired(): Promise<AdminMenuRow[]> {
  const rows = await prisma.adminMenu.findMany({
    orderBy: [{ sort: "asc" }, { id: "asc" }],
    select: {
      id: true,
      parentId: true,
      name: true,
      type: true,
      icon: true,
      path: true,
      component: true,
      componentName: true,
      permissionKey: true,
      sort: true,
      status: true,
      visible: true,
      alwaysShow: true,
      keepAlive: true,
      isBuiltin: true,
    },
  })
  if (rows.length === 0) throw new Error("AdminMenu 为空，无法执行菜单管理操作")
  return rows.map(toRow)
}

/**
 * 数据库菜单读取。React.cache 包装后供单个 RSC 请求复用；数据库暂不可用或菜单表为空时，
 * 后台导航与权限 key 集合回退到内置种子。
 */
export async function loadMenuRowsRaw(): Promise<AdminMenuRow[]> {
  try {
    return await loadMenuRowsRequired()
  } catch (error) {
    console.error("[admin-menu-store] 读取 AdminMenu 失败，使用内置菜单种子", error)
    return [...ADMIN_MENU_SEED]
  }
}

/** 菜单行（请求级缓存）。RSC 里多处调用只查一次库，下一个请求重新查 → 改完立刻生效 */
export const getMenuRows = cache(loadMenuRowsRaw)

/** 菜单树（请求级缓存） */
export const getMenuTree = cache(async (): Promise<AdminMenuNode[]> => buildMenuTree(await getMenuRows()))

/**
 * 当前角色可见的侧栏导航（请求级缓存）。
 *
 * roles 是 React.cache 的缓存键的一部分，所以同一请求里不同角色不会串味。
 */
export const getNavForUser = cache(async (roles: string | null | undefined): Promise<AdminNavItem[]> => {
  const [tree, matrix, roleRows] = await Promise.all([getMenuTree(), getPermissionMatrix(), getPermissionRoles()])
  const activeCodes = new Set(roleRows.filter((row) => row.status === 1).map((row) => row.code))
  const activeRoles = parseRoles(roles).filter((role) => role === "superAdmin" || activeCodes.has(role)).join(",")
  return filterNav(tree, matrix, activeRoles)
})

/**
 * 可用权限 key 全集优先来自数据库中启用的菜单项，数据库不可用时来自内置种子（请求级缓存）。
 *
 * 数据库正常时，权限 key 完全来自数据库菜单行，避免已删除菜单权限继续生效。
 */
export const getPermissionKeySet = cache(async (): Promise<Set<string>> => {
  const rows = await getMenuRows()
  const keys = new Set<string>()
  for (const row of rows) {
    if (row.status === 1 && row.permissionKey) keys.add(row.permissionKey)
  }
  return keys
})
