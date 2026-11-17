"use server"

import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"

import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction } from "@/lib/admin/guard"
import { getPermissionKeySet } from "@/lib/admin/menu-store"
import prisma from "@/lib/prisma"
import { savePermissionMatrixSchema } from "@/validators/role"

/**
 * 角色授权（保存）的数据层。
 *
 * 权限矩阵的**读**视图（getRolePermissionView）已随菜单管理页上线而删除：
 * 新的授权入口是「角色分配」（下一轮），它会按 AdminMenu 树渲染，
 * 不再需要「页面项 / 动作项」这套写死的投影。
 *
 * 写入口 savePermissionMatrix 保留且行为不变：整表按角色全量覆盖。
 * 之所以整表覆盖而不是增量 diff，是因为「取消一个勾」与「勾上一个权限」
 * 走同一条路径，不存在增量接口的边界情况。
 */

/** 超管的特殊 code。DB 里它一行授权都不该有，全量由 hasPermission 硬短路保证 */
const SUPER_ADMIN = "superAdmin"

/**
 * 写：整表按角色全量覆盖。
 *
 * 严格按顺序执行，顺序本身是安全性的一部分：
 * 1. 动作级守卫（不能只靠页面守卫）
 * 2. 角色存在性校验（roleCode 是外键，脏 code 会直接抛 DB 错）
 * 3. 剔除 superAdmin（无论如何都不给它写授权行）
 * 4. 过滤未知 key（静默丢弃，前端传脏数据不该 500）
 * 5. 事务内 deleteMany + createMany（先删后插 = 整表覆盖，避免残留旧授权）
 * 6. 刷新后台外壳（权限读取仅在单个请求内去重）
 *
 * 第 4 步的「已知 key」用数据库菜单表，
 * 与 loadPermissionMatrix 的过滤口径保持一致 —— 否则后台在菜单管理里
 * 新建的 key 会被这里当成脏数据丢掉，「授权了但没生效」极难排查。
 */
export async function savePermissionMatrix(input: {
    matrix: Record<string, string[]>
}): Promise<BaseResource<null>> {
    try {
        // 1. 权限守卫
        await requireAction("settings:update")

        const parsed = savePermissionMatrixSchema.safeParse(input)
        if (!parsed.success) {
            return backFailMessage(parsed.error.issues[0]?.message ?? "参数不合法")
        }

        const submitted = parsed.data.matrix
        const submittedCodes = Object.keys(submitted)

        // 2. 角色必须真实存在
        if (submittedCodes.length > 0) {
            const existing = await prisma.role.findMany({
                where: {code: {in: submittedCodes}},
                select: {code: true},
            })
            const existingCodes = new Set(existing.map((row) => row.code))
            for (const code of submittedCodes) {
                if (!existingCodes.has(code)) return backFailMessage(`角色不存在：${code}`)
            }
        }

        /*
         * 3 + 4. 剔除 superAdmin，并用运行时 key 全集过滤。
         * 去重是必须的：前端理论上不会传重复 key，但 (roleCode, permissionKey)
         * 是唯一索引，重复会让 createMany 报错。
         */
        const knownKeys = await getPermissionKeySet()
        const targets = submittedCodes
            .filter((code) => code !== SUPER_ADMIN)
            .map((code) => ({
                roleCode: code,
                permissionKeys: Array.from(
                    new Set((submitted[code] ?? []).filter((key) => knownKeys.has(key))),
                ),
            }))

        // 5. 整表覆盖
        if (targets.length > 0) {
            await prisma.$transaction(async (tx) => {
                for (const target of targets) {
                    await tx.rolePermission.deleteMany({where: {roleCode: target.roleCode}})
                    if (target.permissionKeys.length > 0) {
                        await tx.rolePermission.createMany({
                            data: target.permissionKeys.map((permissionKey) => ({
                                roleCode: target.roleCode,
                                permissionKey,
                            })),
                            skipDuplicates: true,
                        })
                    }
                }
            })
        }

        // 6. 后续权限读取会实时查询；刷新后台外壳和本页
        revalidatePath("/admin", "layout")
        revalidatePath("/admin/settings/permissions")

        return backSuccessMessage<null>("权限已更新")
    } catch (error) {
        // requireAdminUser 里的 redirect 是「控制流」，不能被 catch 吃掉
        if (isRedirectError(error)) throw error
        return backFailMessage("保存权限失败，请稍后再试")
    }
}
