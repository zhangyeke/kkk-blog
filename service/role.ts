"use server"

import type { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { z, type ZodError } from "zod"

import type { AdminRoleFilter, AdminStatusFilter } from "@/assets/enumerate/global"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction, requirePageAccess } from "@/lib/admin/guard"
import { getAllPermissionKeySet } from "@/lib/admin/menu-store"
import prisma from "@/lib/prisma"
import { createRoleSchema, updateRoleSchema } from "@/validators/role"

/**
 * 角色管理的数据层（服务端）。
 *
 * ── 四条不可动摇的规则 ──
 *
 * 1. **页面守卫 + 动作守卫都要**：`requirePageAccess("roles")` 挡「看不到这页的人」，
 *    `requireAction("role:xxx")` 挡「看得到页面但没被授予增删改的人」。
 *    server action 可以被直接调用，只靠页面守卫等于没鉴权。
 *
 * 2. **内置角色是锚点，只能改「外观」**：code 永远不可改、内置角色不可删除、
 *    内置角色不可停用。停用内置角色 = 把自己锁在门外（superAdmin 一停，
 *    没人能进角色管理页把它改回来）。
 *
 * 3. **superAdmin 的授权行永远不写**：权限判定由 hasPermission 硬短路，
 *    DB 里给它插行只会制造「看起来能改、改完没差别」的假象。
 *
 * 4. **写操作后刷新后台外壳**：权限数据在每个服务端请求中从数据库读取，
 *    React.cache 只在单个请求内去重，不需要跨请求失效。
 */

/** 超管 code：DB 里它一行授权都不该有，全量由 hasPermission 硬短路保证 */
const SUPER_ADMIN = "superAdmin"

/**
 * 内置保留 code（统一小写比较）。
 *
 * 为什么要拦：Role.code 是 RolePermission 的外键锚点，
 * 一旦自定义角色占用了 `admin` 这类标识，权限判定会把它当成内置管理员，
 * 后果比「重名不好看」严重得多。
 */
const RESERVED_CODES: ReadonlySet<string> = new Set(["superadmin", "admin", "user"])

/**
 * superAdmin 的权限数哨兵值。
 *
 * 超管没有授权行（也不需要），但界面上必须显示「全部」而不是 0。
 * 用负数当哨兵，前端见到 `< 0` 就渲染成「全部」——
 * 比在行里塞一个 `string | number` 联合类型更好处理（列对齐、排序都不受影响）。
 */
const ALL_PERMISSION_COUNT = -1

/** 列表行：扁平行 + 两个统计列 */
export type RoleListRow = {
    id: number
    code: string
    name: string
    description: string | null
    isBuiltin: boolean
    status: number
    scopeAll: boolean
    sort: number
    /** ISO 字符串：Server Action 的返回值要能跨 RSC 边界序列化 */
    createdAt: string
    /** User.roles 逗号串里精确包含该 code 的用户数 */
    memberCount: number
    /** RolePermission 行数；superAdmin 为 ALL_PERMISSION_COUNT（前端渲染「全部」） */
    permissionCount: number
}

/** 角色管理页的完整视图 */
export type RoleListView = {
    /** 已按 sort ASC, id ASC 排好序 */
    rows: RoleListRow[]
    /** 过滤后的角色总数（角色表很小，不做分页） */
    total: number
}

/** 读失败时的空壳，保证客户端组件永远拿到合法 props */
const EMPTY_VIEW: RoleListView = { rows: [], total: 0 }

/** 编辑入参：validators/role.ts 的 schema 只管字段，id 由这里补上 */
const updateRolePayloadSchema = updateRoleSchema.extend({
    id: z.number().int().positive(),
})

/**
 * zod 的第一条错误信息。
 *
 * zod 默认文案是英文（"String must contain at least 1 character(s)"），
 * 直接弹给用户很别扭；这里对最常踩的几个字段做中文映射，
 * 其余仍回落到 zod 自己的 message（那些 message 是 schema 里写好的中文）。
 */
function firstIssue(error: ZodError): string {
    const issue = error.issues[0]
    if (!issue) return "参数不合法"
    const field = issue.path[0]

    if (issue.code === "too_small") {
        if (field === "name") return "请填写显示名称"
        if (field === "code") return "角色标识太短，至少 2 位"
        if (field === "id") return "角色不存在"
    }
    if (issue.code === "too_big") {
        if (field === "name") return "显示名称最多 20 字"
        if (field === "description") return "描述最多 100 字"
    }
    return issue.message || "参数不合法"
}

/**
 * 写操作后刷新后台外壳与本页；权限读取只在当前请求内缓存，后续请求自然读取新数据。
 */
function revalidateRoleSurfaces(): void {
    revalidatePath("/admin", "layout")
    revalidatePath("/admin/users/roles")
}

/**
 * 每个角色下的成员数（**精确**统计）。
 *
 * ── 为什么不用 `contains` ──
 * `prisma.user.count({where: {roles: {contains: code}}})` 是子串匹配：
 * 查 `admin` 会命中 `superAdmin`（在大小写不敏感的排序规则下）、
 * 查 `editor` 会命中 `editor2`，结果只能当近似值用。
 *
 * 这里改为「一次读回 roles 列，在内存里按逗号精确 split 后计数」：
 * - 语义与 lib/admin/permissions.ts 的 parseRoles 完全一致（同一套拆分规则）；
 * - 只 select 一列，传输量极小；角色管理页是低频页面，一次全表扫描可接受。
 * 若将来用户表到十万级，再改成「roles 建索引 + 按角色 count」的专用查询。
 */
async function loadMemberCounts(): Promise<Map<string, number>> {
    const rows = await prisma.user.findMany({ select: { roles: true } })
    const counts = new Map<string, number>()

    for (const row of rows) {
        // 同一用户写了两次同角色只算一个人
        const codes = new Set(
            (row.roles ?? "")
                .split(",")
                .map((code) => code.trim())
                .filter(Boolean),
        )
        for (const code of codes) {
            counts.set(code, (counts.get(code) ?? 0) + 1)
        }
    }

    return counts
}

/* ------------------------------------------------------------------ *
 * 读
 * ------------------------------------------------------------------ */

/**
 * 角色列表。
 *
 * 三个统计/过滤口径：
 * - 过滤（keyword / type / status）在 SQL 里做，角色表很小但没必要全量搬内存；
 * - 成员数走 loadMemberCounts（精确 split）；
 * - 权限数走 groupBy（一次聚合，避免 N+1）。
 */
export async function getRoleListView(params?: {
    keyword?: string
    type?: AdminRoleFilter
    status?: AdminStatusFilter
}): Promise<BaseResource<RoleListView>> {
    try {
        await requirePageAccess("roles")

        const keyword = params?.keyword?.trim() ?? ""
        const type = params?.type ?? "all"
        const status = params?.status ?? "all"

        const where: Prisma.RoleWhereInput = {}
        if (keyword !== "") {
            where.OR = [
                { name: { contains: keyword, mode: "insensitive" } },
                { code: { contains: keyword, mode: "insensitive" } },
                { description: { contains: keyword, mode: "insensitive" } },
            ]
        }
        if (type === "builtin") where.isBuiltin = true
        else if (type === "custom") where.isBuiltin = false
        if (status === "1" || status === "0") where.status = Number(status)

        const [roleRows, permissionGroups, memberCounts] = await Promise.all([
            prisma.role.findMany({
                where,
                select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                    isBuiltin: true,
                    status: true,
                    scopeAll: true,
                    sort: true,
                    createdAt: true,
                },
                orderBy: [{ sort: "asc" }, { id: "asc" }],
            }),
            prisma.rolePermission.groupBy({
                by: ["roleCode"],
                _count: { _all: true },
            }),
            loadMemberCounts(),
        ])

        const permissionCounts = new Map<string, number>()
        for (const group of permissionGroups) {
            permissionCounts.set(group.roleCode, group._count._all)
        }

        const rows: RoleListRow[] = roleRows.map((row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            description: row.description,
            isBuiltin: row.isBuiltin,
            status: row.status,
            scopeAll: row.scopeAll,
            sort: row.sort,
            createdAt: row.createdAt.toISOString(),
            memberCount: memberCounts.get(row.code) ?? 0,
            permissionCount:
                row.code === SUPER_ADMIN
                    ? ALL_PERMISSION_COUNT
                    : (permissionCounts.get(row.code) ?? 0),
        }))

        return backSuccessMessage("获取角色列表成功", { rows, total: rows.length })
    } catch (error) {
        // 页面守卫里的 redirect 是控制流，不能被 catch 吃掉
        if (isRedirectError(error)) throw error
        console.warn("[service/role] 读取角色列表失败", error)
        return backFailMessage("读取角色列表失败，请刷新页面重试", EMPTY_VIEW)
    }
}

/**
 * 某个角色当前的权限 key 列表（分配权限弹窗的初始勾选态）。
 *
 * superAdmin 直接返回运行时全集（数据库中启用的菜单项）：
 * 它没有授权行，但界面必须显示「全勾」，否则用户会以为超管权限被清空了。
 */
export async function getRoleMenuKeys(code: string): Promise<BaseResource<string[]>> {
    try {
        await requirePageAccess("roles")

        const roleCode = typeof code === "string" ? code.trim() : ""
        if (roleCode === "") return backFailMessage("角色标识不能为空", [])

        const existing = await prisma.role.findUnique({
            where: { code: roleCode },
            select: { code: true },
        })
        if (!existing) return backFailMessage("角色不存在，可能已被删除", [])

        const knownKeys = await getAllPermissionKeySet()
        if (roleCode === SUPER_ADMIN) {
            return backSuccessMessage("超级管理员拥有全部权限", [...knownKeys])
        }

        const rows = await prisma.rolePermission.findMany({
            where: { roleCode },
            select: { permissionKey: true },
        })

        // 过滤掉字典里已经没有的旧 key（与 loadPermissionMatrix 同口径），
        // 否则前端会画出「勾上了但看不见」的幽灵授权
        const keys = rows
            .map((row) => row.permissionKey)
            .filter((key) => knownKeys.has(key))

        return backSuccessMessage("获取角色权限成功", keys)
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/role] 读取角色权限失败", error)
        return backFailMessage("读取角色权限失败，请刷新页面重试", [])
    }
}

/* ------------------------------------------------------------------ *
 * 写
 * ------------------------------------------------------------------ */

/**
 * 新建角色。
 *
 * 顺序即安全性：动作守卫 → 形状（zod）→ 保留字 → code 唯一 → 落库。
 */
export async function createRole(input: unknown): Promise<BaseResource<{ id: number }>> {
    try {
        await requireAction("role:create")

        const parsed = createRoleSchema.safeParse(input)
        if (!parsed.success) return backFailMessage(firstIssue(parsed.error), { id: 0 })
        const data = parsed.data

        if (RESERVED_CODES.has(data.code.toLowerCase())) {
            return backFailMessage("该标识是内置角色保留字，请换一个", { id: 0 })
        }

        const taken = await prisma.role.findUnique({
            where: { code: data.code },
            select: { id: true },
        })
        if (taken) return backFailMessage("角色标识已存在", { id: 0 })

        const created = await prisma.role.create({
            data: {
                code: data.code,
                name: data.name,
                description: data.description?.trim() ? data.description.trim() : null,
                scopeAll: data.scopeAll ?? false,
                sort: data.sort ?? 0,
                // 新建角色一律「正常」：停用是编辑时才需要考虑的状态
                status: 1,
                isBuiltin: false,
            },
            select: { id: true },
        })

        revalidateRoleSurfaces()
        return backSuccessMessage("角色已创建", { id: created.id })
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/role] 创建角色失败", error)
        return backFailMessage("创建角色失败，请稍后再试", { id: 0 })
    }
}

/**
 * 编辑角色（部分更新）。
 *
 * 两条硬约束：
 * - `code` 永远不可改（RolePermission 外键指向它，改了等于把授权整体孤立）；
 * - 内置角色不可改 `status`（停用 superAdmin = 把自己锁死，无法再改回来）。
 *
 * 注意 zod 会剥掉 schema 之外的字段，所以 `code` 的「试图修改」检查
 * 必须在 parse 之前从原始入参里读，parse 之后就已经看不见了。
 */
export async function updateRole(input: unknown): Promise<BaseResource<null>> {
    try {
        await requireAction("role:update")

        const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>
        const parsed = updateRolePayloadSchema.safeParse(raw)
        if (!parsed.success) return backFailMessage(firstIssue(parsed.error))
        const { id, ...patch } = parsed.data

        const existing = await prisma.role.findUnique({ where: { id } })
        if (!existing) return backFailMessage("角色不存在，可能已被删除")

        if (typeof raw.code === "string" && raw.code.trim() !== existing.code) {
            return backFailMessage("角色标识不可修改")
        }

        if (
            existing.isBuiltin &&
            patch.status !== undefined &&
            patch.status !== existing.status
        ) {
            return backFailMessage("内置角色不可修改状态")
        }

        const description =
            patch.description !== undefined
                ? patch.description.trim() === ""
                    ? null
                    : patch.description.trim()
                : existing.description

        await prisma.role.update({
            where: { id },
            data: {
                name: patch.name ?? existing.name,
                description,
                scopeAll: patch.scopeAll ?? existing.scopeAll,
                sort: patch.sort ?? existing.sort,
                status: patch.status ?? existing.status,
            },
        })

        revalidateRoleSurfaces()
        return backSuccessMessage("角色已更新")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/role] 更新角色失败", error)
        return backFailMessage("更新角色失败，请稍后再试")
    }
}

/**
 * 删除角色。
 *
 * 两道闸：
 * 1. 内置角色拒绝（侧栏与路由守卫都按这些 code 兜底，删了等于拆地基）；
 * 2. **有成员时拒绝**：User.roles 是逗号串，没有外键约束，
 *    删掉角色不会让用户的 roles 字段变干净，只会留下指向不存在角色的孤儿 code
 *    —— 那些人下次登录会拿到「一个权限都没有」的空后台，且无从排查。
 *
 * 授权行与角色行在同一个事务里删：RolePermission 的外键是 onDelete Cascade，
 * 但显式删一遍更稳（手工 SQL 建表时可能没带级联），也让意图写在代码里。
 */
export async function deleteRole(id: number): Promise<BaseResource<null>> {
    try {
        await requireAction("role:delete")

        if (!Number.isInteger(id) || id <= 0) return backFailMessage("角色不存在")

        const existing = await prisma.role.findUnique({
            where: { id },
            select: { id: true, code: true, name: true, isBuiltin: true },
        })
        if (!existing) return backFailMessage("角色不存在，可能已被删除")
        if (existing.isBuiltin) return backFailMessage("内置角色不可删除")

        const memberCounts = await loadMemberCounts()
        const members = memberCounts.get(existing.code) ?? 0
        if (members > 0) {
            return backFailMessage(`该角色下还有 ${members} 个用户，请先移除后再删除`)
        }

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleCode: existing.code } })
            await tx.role.delete({ where: { id: existing.id } })
        })

        revalidateRoleSurfaces()
        return backSuccessMessage(`已删除角色「${existing.name}」`)
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/role] 删除角色失败", error)
        return backFailMessage("删除角色失败，请稍后再试")
    }
}

/**
 * 保存某个角色的权限（整表覆盖）。
 *
 * 为什么整表覆盖而不是增量 diff：勾上一个与取消一个走同一条路径，
 * 不存在增量接口的边界情况；前端把「当前全勾选集合」整体回传即可。
 *
 * 三道过滤：
 * - superAdmin 直接拒绝（它的权限由代码硬短路，写库只会制造假象）；
 * - 未知 key 静默丢弃（菜单树驱动下 key 是数据，前端可能传旧值）；
 * - 去重（(roleCode, permissionKey) 是唯一索引，重复会让 createMany 报错）。
 *
 * 目录（dir）没有 permissionKey，所以「不提交 dir 的 key」是前端天然满足的：
 * 它压根没有 key 可以提交。
 */
export async function saveRolePermissions(input: {
    code: string
    keys: string[]
}): Promise<BaseResource<null>> {
    try {
        await requireAction("role:assign")

        const roleCode = typeof input?.code === "string" ? input.code.trim() : ""
        if (roleCode === "") return backFailMessage("角色标识不能为空")
        if (roleCode === SUPER_ADMIN) return backFailMessage("超级管理员权限不可修改")

        const submitted = Array.isArray(input?.keys) ? input.keys : []

        const existing = await prisma.role.findUnique({
            where: { code: roleCode },
            select: { code: true, name: true },
        })
        if (!existing) return backFailMessage("角色不存在，可能已被删除")

        const knownKeys = await getAllPermissionKeySet()
        const keys = Array.from(
            new Set(submitted.filter((key): key is string => typeof key === "string" && knownKeys.has(key))),
        )

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleCode } })
            if (keys.length > 0) {
                await tx.rolePermission.createMany({
                    data: keys.map((permissionKey) => ({ roleCode, permissionKey })),
                    skipDuplicates: true,
                })
            }
        })

        revalidateRoleSurfaces()
        return backSuccessMessage("权限已保存")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/role] 保存角色权限失败", error)
        return backFailMessage("保存权限失败，请稍后再试")
    }
}
