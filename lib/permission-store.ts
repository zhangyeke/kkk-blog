/** 权限读取层：React.cache 仅在单次服务端请求内去重，不跨请求缓存。 */
import "server-only"

import { cache } from "react"

import { getMenuRows, getPermissionKeySet } from "@/lib/admin-menu-store"
import {
    ACTION_ITEMS,
    type AdminAction,
    DEFAULT_PERMISSION_MATRIX,
    parseRoles,
    type PermissionMatrix,
    resolveAllowedKeys,
} from "@/lib/permissions"
import prisma from "@/lib/prisma"

/** 角色元信息（给侧栏 / 403 页 / 权限管理页显示自定义角色名用） */
export type PermissionRoleRow = {
    code: string
    name: string
    description: string | null
    isBuiltin: boolean
    status: number
    scopeAll: boolean
    sort: number
}

/** DB 中的授权行只接受当前菜单树真实存在的 permissionKey。 */
async function loadPermissionMatrix(): Promise<PermissionMatrix> {
    try {
        const [rows, menuRows, roles] = await Promise.all([
            prisma.rolePermission.findMany({select: {roleCode: true, permissionKey: true}}),
            getMenuRows(),
            getPermissionRoles(),
        ])

        const knownKeys = new Set(menuRows.flatMap((row) => row.status === 1 && row.permissionKey ? [row.permissionKey] : []))
        const activeRoleCodes = new Set(roles.filter((role) => role.status === 1).map((role) => role.code))
        const matrix: PermissionMatrix = {}
        for (const row of rows) {
            if (!knownKeys.has(row.permissionKey) || !activeRoleCodes.has(row.roleCode)) continue
            const bucket = matrix[row.roleCode]
            if (bucket) bucket.push(row.permissionKey)
            else matrix[row.roleCode] = [row.permissionKey]
        }
        return rows.length === 0 ? DEFAULT_PERMISSION_MATRIX : matrix
    } catch (error) {
        console.error("[permission-store] 读取角色权限失败，使用默认权限矩阵", error)
        return DEFAULT_PERMISSION_MATRIX
    }
}

const BUILTIN_PERMISSION_ROLES: PermissionRoleRow[] = [
    {code: "superAdmin", name: "超级管理员", description: null, isBuiltin: true, status: 1, scopeAll: true, sort: 1},
    {code: "admin", name: "管理员", description: null, isBuiltin: true, status: 1, scopeAll: true, sort: 2},
    {code: "user", name: "普通用户", description: null, isBuiltin: true, status: 1, scopeAll: false, sort: 3},
]

async function loadPermissionRoles(): Promise<PermissionRoleRow[]> {
    try {
        const roles = await prisma.role.findMany({
            select: {code: true, name: true, description: true, isBuiltin: true, status: true, scopeAll: true, sort: true},
            orderBy: [{sort: "asc"}, {id: "asc"}],
        })
        return roles.length === 0 ? BUILTIN_PERMISSION_ROLES : roles
    } catch (error) {
        console.error("[permission-store] 读取角色数据失败，使用内置角色", error)
        return BUILTIN_PERMISSION_ROLES
    }
}

/** 同一 RSC 请求中的 layout、sidebar、topbar 和页面守卫共用查询结果。 */
export const getPermissionMatrix = cache(loadPermissionMatrix)
export const getPermissionRoles = cache(loadPermissionRoles)

async function hasPersistedPermissionKey(permissionKey: string): Promise<boolean> {
    try {
        return Boolean(await prisma.adminMenu.findUnique({
            where: {permissionKey},
            select: {id: true},
        }))
    } catch {
        return false
    }
}

/** 当前用户的页面、动作及自定义权限 key；数据库授权缺失时使用默认矩阵。 */
export const getAllowedKeys = cache(async (roles: string | null | undefined): Promise<string[]> => {
    const footprintUpdateKey = "action:footprint:update"
    const footprintCreateKey = "action:footprint:create"
    const [matrix, allKeys, roleRows, hasFootprintUpdatePermission] = await Promise.all([
        getPermissionMatrix(),
        getPermissionKeySet(),
        getPermissionRoles(),
        hasPersistedPermissionKey(footprintUpdateKey),
    ])
    const activeRoleCodes = new Set(roleRows.filter((role) => role.status === 1).map((role) => role.code))
    const activeRoles = parseRoles(roles).filter((role) => role === "superAdmin" || activeRoleCodes.has(role)).join(",")
    const allowedKeys = resolveAllowedKeys(matrix, activeRoles, [...allKeys])

    // 老数据库还未添加足迹编辑菜单权限时，暂以已有的创建权限兼容编辑功能。
    // 008 迁移新增该 key 后，编辑权限将按 RolePermission 独立控制。
    if (!hasFootprintUpdatePermission && allowedKeys.includes(footprintCreateKey)) {
        allowedKeys.push(footprintUpdateKey)
    }

    return allowedKeys
})

export async function getAllowedActions(roles: string | null | undefined): Promise<AdminAction[]> {
    const granted = new Set(await getAllowedKeys(roles))
    return ACTION_ITEMS.filter((item) => granted.has(item.key)).map((item) => item.code)
}

