"use server"

import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import type { ZodError } from "zod"

import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction, requirePageAccess } from "@/lib/admin-guard"
import { getMenuRows, loadMenuRowsRequired } from "@/lib/admin-menu-store"
import type { AdminMenuRow } from "@/lib/admin-menu-seed"
import { descendantIdsOf } from "@/lib/menu-tree"
import prisma from "@/lib/prisma"
import { createMenuSchema, updateMenuSchema } from "@/validators/menu"

/**
 * 菜单管理的数据层（服务端）。
 *
 * ── 三条不可动摇的规则 ──
 *
 * 1. **页面守卫 + 动作守卫都要**：页面守卫挡「看不到这个页面的人」，
 *    动作守卫挡「看得到页面但没被授予增删改的人」。server action 可以被直接调用，
 *    只靠页面守卫等于没鉴权。
 *
 * 2. **写操作后刷新后台外壳**：菜单快照每次导航从数据库读取，React.cache 只在
 *    单个请求内去重，不会把旧菜单带到后续请求。
 *
 * 3. **内置节点（isBuiltin）只允许改「外观」**：name / icon / sort / status /
 *    visible / alwaysShow / keepAlive。type / permissionKey / parentId 会改变菜单结构
 *    或授权 key，不能作为普通外观字段修改。
 */

/** 列表行：扁平行 + 授权计数（给「权限标识」列的 (N) 角标用） */
export type MenuListRow = AdminMenuRow & {
    children?: MenuListRow[]
    /** 该 permissionKey 被多少个角色授权（显示用） */
    grantCount: number
}

/** 菜单管理页的完整视图 */
export type MenuListView = {
    /** 扁平表，按 parentId+sort 预排序好；前端负责建树与缩进 */
    rows: AdminMenuRow[]
    grantCounts: Record<string, number>
    roles: Array<{ code: string; name: string; isBuiltin: boolean }>
}

/** 读失败时的空壳，保证客户端组件永远拿到合法 props */
const EMPTY_VIEW: MenuListView = { rows: [], grantCounts: {}, roles: [] }

/** zod 的第一条错误信息（表单字段错误一次只提示一条，避免刷屏） */
function firstIssue(error: ZodError): string {
    return error.issues[0]?.message ?? "参数不合法"
}

/**
 * 写操作成功后刷新依赖菜单的 RSC 页面；菜单读取仅在单个请求内去重。
 */
function revalidateMenuSurfaces(): void {
    revalidatePath("/admin", "layout")
    revalidatePath("/admin/settings/permissions")
}

/**
 * 收集某节点的整棵子树 id（含自身）。
 *
 * 用菜单行算而不是递归查库：一次查库就能拿到全表，递归查库在深树上是 N 次往返。
 * 这里使用严格的数据库读取，不能通过导航用的静态种子继续执行菜单写操作。
 */
async function collectSubtreeIds(rootId: number): Promise<number[]> {
    return descendantIdsOf(await loadMenuRowsRequired(), rootId)
}

/** 同级下是否已有同名节点（excludeId 用于编辑时排除自己） */
async function hasSiblingName(
    parentId: number | null,
    name: string,
    excludeId?: number,
): Promise<boolean> {
    const found = await prisma.adminMenu.findFirst({
        where: {
            parentId,
            name,
            ...(excludeId === undefined ? {} : {id: {not: excludeId}}),
        },
        select: {id: true},
    })
    return found !== null
}

/** permissionKey 是否已被别的节点占用（excludeId 用于编辑时排除自己） */
async function isPermissionKeyTaken(permissionKey: string, excludeId?: number): Promise<boolean> {
    const found = await prisma.adminMenu.findFirst({
        where: {
            permissionKey,
            ...(excludeId === undefined ? {} : {id: {not: excludeId}}),
        },
        select: {id: true},
    })
    return found !== null
}

/* ------------------------------------------------------------------ *
 * 读
 * ------------------------------------------------------------------ */

/**
 * 菜单管理页的列表数据。
 *
 * 行本身走 getMenuRows（请求级缓存），授权计数与角色列表另外查：
 * 计数是「按 permissionKey 聚合」，角色列表是「给授权角标做文案」，
 * 两者都与菜单树无关，可以并发。
 */
export async function getMenuListView(): Promise<BaseResource<MenuListView>> {
    try {
        await requirePageAccess("menus")

        const [sourceRows, grantRows, roleRows] = await Promise.all([
            getMenuRows(),
            prisma.rolePermission.groupBy({
                by: ["permissionKey"],
                _count: {_all: true},
            }),
            prisma.role.findMany({
                select: {code: true, name: true, isBuiltin: true},
                orderBy: [{sort: "asc"}, {id: "asc"}],
            }),
        ])

        const grantCounts: Record<string, number> = {}
        for (const row of grantRows) {
            grantCounts[row.permissionKey] = row._count._all
        }

        /*
         * 按 parentId + sort 预排序：调用方（列表页）只需要「子节点相对父节点
         * 已经是正确顺序」，建树时不必再排一次；parentId 为 null 的根节点排在最前。
         */
        const rows = [...sourceRows].sort((a, b) => {
            const parentA = a.parentId ?? -1
            const parentB = b.parentId ?? -1
            if (parentA !== parentB) return parentA - parentB
            if (a.sort !== b.sort) return a.sort - b.sort
            return a.id - b.id
        })

        return backSuccessMessage("获取菜单列表成功", {
            rows,
            grantCounts,
            roles: roleRows,
        })
    } catch (error) {
        // 页面守卫里的 redirect 是控制流，不能被 catch 吃掉
        if (isRedirectError(error)) throw error
        console.warn("[service/menu] 读取菜单列表失败", error)
        return backFailMessage("读取菜单列表失败，请刷新页面重试", EMPTY_VIEW)
    }
}

/* ------------------------------------------------------------------ *
 * 写
 * ------------------------------------------------------------------ */

/**
 * 新建菜单。
 *
 * 校验顺序即安全性：动作守卫 → 形状（zod）→ 父节点存在且不是 button →
 * 同级重名 → 权限标识唯一 → 落库。
 */
export async function createMenu(input: unknown): Promise<BaseResource<{id: number}>> {
    try {
        await requireAction("menu:create")

        const parsed = createMenuSchema.safeParse(input)
        if (!parsed.success) return backFailMessage(firstIssue(parsed.error), {id: 0})
        const data = parsed.data
        const parentId = data.parentId ?? null

        if (parentId !== null) {
            const parent = await prisma.adminMenu.findUnique({
                where: {id: parentId},
                select: {id: true, type: true},
            })
            if (!parent) return backFailMessage("上级菜单不存在，请重新选择", {id: 0})
            // 按钮是最末级：它只承载一个权限 key，不能再挂子项
            if (parent.type === "button") {
                return backFailMessage("按钮是末级节点，不能添加子项", {id: 0})
            }
        }

        if (await hasSiblingName(parentId, data.name)) {
            return backFailMessage(`同级下已存在「${data.name}」，请换一个名称`, {id: 0})
        }

        // 目录是纯分组，不产生权限项（zod 已校验，这里再兜一层脏入参）
        const permissionKey = data.type === "dir" ? null : (data.permissionKey ?? null)
        if (permissionKey && (await isPermissionKeyTaken(permissionKey))) {
            return backFailMessage("权限标识已被使用", {id: 0})
        }

        const created = await prisma.adminMenu.create({
            data: {
                parentId,
                name: data.name,
                type: data.type,
                icon: data.type === "button" ? null : (data.icon ?? null),
                path: data.type === "button" ? null : (data.path ?? null),
                component: data.type === "menu" ? (data.component ?? null) : null,
                componentName: data.type === "menu" ? (data.componentName ?? null) : null,
                permissionKey,
                sort: data.sort,
                status: data.status,
                visible: data.visible,
                alwaysShow: data.type === "dir" ? data.alwaysShow : false,
                keepAlive: data.type === "menu" ? data.keepAlive : false,
                isBuiltin: false,
            },
            select: {id: true},
        })

        revalidateMenuSurfaces()
        return backSuccessMessage("菜单已创建", {id: created.id})
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/menu] 创建菜单失败", error)
        return backFailMessage("创建菜单失败，请稍后再试", {id: 0})
    }
}

/**
 * 编辑菜单（部分更新）。
 *
 * permissionKey 变更时**迁移旧授权**而不是删掉：
 * 事务内先清掉新 key 上可能残留的授权（避免 (roleCode, permissionKey) 唯一索引冲突），
 * 再把旧 key 的授权整体改名。这样「改个标识」不会把已经配好的角色授权悄悄清空。
 */
export async function updateMenu(input: unknown): Promise<BaseResource<null>> {
    try {
        await requireAction("menu:update")

        const parsed = updateMenuSchema.safeParse(input)
        if (!parsed.success) return backFailMessage(firstIssue(parsed.error))
        const {id, ...patch} = parsed.data

        const existing = await prisma.adminMenu.findUnique({where: {id}})
        if (!existing) return backFailMessage("菜单不存在，可能已被删除")

        const nextType = patch.type ?? existing.type
        const nextParentId = patch.parentId !== undefined ? patch.parentId : existing.parentId
        const nextKey = patch.permissionKey !== undefined ? patch.permissionKey : existing.permissionKey
        const nextName = patch.name ?? existing.name

        /*
         * 内置节点保护：只比对「是否真的想改」，值没变就不拦 ——
         * 前端把整表单回传时一定带着 type / permissionKey / parentId，
         * 如果一看到这三个字段就拒绝，内置节点连改名都改不了。
         */
        if (existing.isBuiltin) {
            if (patch.type !== undefined && patch.type !== existing.type) {
                return backFailMessage("内置节点不可修改类型")
            }
            if (patch.permissionKey !== undefined && (patch.permissionKey ?? null) !== existing.permissionKey) {
                return backFailMessage("内置节点不可修改权限标识")
            }
            if (patch.parentId !== undefined && (patch.parentId ?? null) !== existing.parentId) {
                return backFailMessage("内置节点不可修改上级菜单")
            }
        }

        // 环检测：不能挂到自己身上，也不能挂到自己的后代上
        if (nextParentId !== null && nextParentId !== existing.parentId) {
            if (nextParentId === id) return backFailMessage("上级菜单不能是自己")
            const parent = await prisma.adminMenu.findUnique({
                where: {id: nextParentId},
                select: {id: true, type: true},
            })
            if (!parent) return backFailMessage("上级菜单不存在，请重新选择")
            if (parent.type === "button") return backFailMessage("按钮是末级节点，不能添加子项")
            const subtree = await collectSubtreeIds(id)
            if (subtree.includes(nextParentId)) return backFailMessage("上级菜单不能是自己的子级")
        }

        // 同级重名：名称或上级变了才有必要查
        if (
            nextName !== existing.name ||
            nextParentId !== existing.parentId
        ) {
            if (await hasSiblingName(nextParentId, nextName, id)) {
                return backFailMessage(`同级下已存在「${nextName}」，请换一个名称`)
            }
        }

        if (nextKey && nextKey !== existing.permissionKey && (await isPermissionKeyTaken(nextKey, id))) {
            return backFailMessage("权限标识已被使用")
        }

        // 换类型时把不相关字段清干净，避免「button 上还挂着 path」这种脏数据
        const icon = nextType === "button" ? null : (patch.icon !== undefined ? patch.icon : existing.icon)
        const path = nextType === "button" ? null : (patch.path !== undefined ? patch.path : existing.path)
        const component =
            nextType === "menu" ? (patch.component !== undefined ? patch.component : existing.component) : null
        const componentName =
            nextType === "menu"
                ? patch.componentName !== undefined
                    ? patch.componentName
                    : existing.componentName
                : null
        const permissionKey = nextType === "dir" ? null : nextKey
        const alwaysShow = nextType === "dir" ? (patch.alwaysShow ?? existing.alwaysShow) : false
        const keepAlive = nextType === "menu" ? (patch.keepAlive ?? existing.keepAlive) : false

        await prisma.$transaction(async (tx) => {
            // 权限标识改名 → 把旧授权迁到新 key（先清新 key 的残留，避免唯一索引冲突）
            if (permissionKey && permissionKey !== existing.permissionKey) {
                await tx.rolePermission.deleteMany({where: {permissionKey}})
                // 旧 key 为空 = 这个节点以前不产生授权（如 dir → menu），没有可迁移的行
                if (existing.permissionKey) {
                    await tx.rolePermission.updateMany({
                        where: {permissionKey: existing.permissionKey},
                        data: {permissionKey},
                    })
                }
            }

            await tx.adminMenu.update({
                where: {id},
                data: {
                    parentId: nextParentId,
                    name: nextName,
                    type: nextType,
                    icon,
                    path,
                    component,
                    componentName,
                    permissionKey,
                    sort: patch.sort ?? existing.sort,
                    status: patch.status ?? existing.status,
                    visible: patch.visible ?? existing.visible,
                    alwaysShow,
                    keepAlive,
                },
            })
        })

        revalidateMenuSurfaces()
        return backSuccessMessage("菜单已更新")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/menu] 更新菜单失败", error)
        return backFailMessage("更新菜单失败，请稍后再试")
    }
}

/**
 * 删除菜单（含整棵子树）。
 *
 * 必须先收集子树里所有 permissionKey 再删行：AdminMenu 的外键是 ON DELETE CASCADE，
 * 父行一删子行就跟着没了，那时候再想去读子行的 permissionKey 已经读不到 ——
 * 授权表里就会留下指向「不存在的菜单」的孤儿 key。
 */
export async function deleteMenu(id: number): Promise<BaseResource<null>> {
    try {
        await requireAction("menu:delete")

        if (!Number.isInteger(id) || id <= 0) return backFailMessage("菜单不存在")

        const existing = await prisma.adminMenu.findUnique({
            where: {id},
            select: {id: true, name: true, isBuiltin: true},
        })
        if (!existing) return backFailMessage("菜单不存在，可能已被删除")
        if (existing.isBuiltin) return backFailMessage("内置菜单不可删除")

        const subtreeIds = await collectSubtreeIds(id)
        const subtreeRows = await prisma.adminMenu.findMany({
            where: {id: {in: subtreeIds}},
            select: {permissionKey: true},
        })
        const keys = subtreeRows
            .map((row) => row.permissionKey)
            .filter((key): key is string => key != null && key !== "")

        await prisma.$transaction(async (tx) => {
            if (keys.length > 0) {
                await tx.rolePermission.deleteMany({where: {permissionKey: {in: keys}}})
            }
            // 子行由 DB 的 ON DELETE CASCADE 带走（见 prisma/manual-sql/004）
            await tx.adminMenu.delete({where: {id}})
        })

        revalidateMenuSurfaces()
        return backSuccessMessage(`已删除「${existing.name}」及其子项`)
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/menu] 删除菜单失败", error)
        return backFailMessage("删除菜单失败，请稍后再试")
    }
}

/**
 * 启用 / 停用。
 *
 * 内置节点不允许停用：内置菜单的 path 是代码里路由守卫的锚点，
 * 停用会让「有权限但进不去」，比报错更难排查。
 */
export async function toggleMenuStatus(id: number, status: 0 | 1): Promise<BaseResource<null>> {
    try {
        await requireAction("menu:update")

        if (!Number.isInteger(id) || id <= 0) return backFailMessage("菜单不存在")
        if (status !== 0 && status !== 1) return backFailMessage("状态值不合法")

        const existing = await prisma.adminMenu.findUnique({
            where: {id},
            select: {id: true, name: true, isBuiltin: true, status: true},
        })
        if (!existing) return backFailMessage("菜单不存在，可能已被删除")
        if (existing.isBuiltin && status === 0) return backFailMessage("内置菜单不可停用")
        if (existing.status === status) return backSuccessMessage("状态未变化")

        await prisma.adminMenu.update({where: {id}, data: {status}})

        revalidateMenuSurfaces()
        return backSuccessMessage(status === 1 ? "已启用" : "已停用")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/menu] 切换菜单状态失败", error)
        return backFailMessage("切换状态失败，请稍后再试")
    }
}

/**
 * 手动重新请求菜单与权限数据。读取层没有跨请求缓存，这个操作会刷新当前 RSC 外壳。
 */
export async function refreshMenuCache(): Promise<BaseResource<null>> {
    try {
        await requireAction("menu:update")
        revalidateMenuSurfaces()
        return backSuccessMessage("已重新读取菜单和权限")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/menu] 刷新菜单缓存失败", error)
        return backFailMessage("刷新失败，请稍后再试")
    }
}
