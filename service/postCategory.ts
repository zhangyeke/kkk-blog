'use server';
import {Prisma} from "@prisma/client";
import {revalidatePath} from "next/cache";
import {isRedirectError} from "next/dist/client/components/redirect-error";
import prisma from '@/lib/prisma'
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
import {requireAction, requirePageAccess} from "@/lib/admin/guard";
import {normalizePaging} from "@/lib/paging";
import {PostCategoryWithPosts} from "@/types/postCategory";
import {postWithUserInclude} from "@/types/post";
import type {AdminStatusFilter} from "@/assets/enumerate/global";

export async function createPostCategory() {

}

export async function getPostCategoryList(params?: Prisma.PostCategoryWhereInput) {
    try {
        const where: Prisma.PostCategoryWhereInput = {...params, status: params?.status ?? 1}
        if (typeof where.name === "string" && where.name) {
            where.name = {
                contains: where.name as string,
                mode: 'insensitive'
            }
        }
        const data = await prisma.postCategory.findMany({
            where,
        })
        return backSuccessMessage("获取分类列表成功", data)
    } catch {
        return backFailMessage("获取分类列表失败", [])
    }

}

/*获取文章分类以及关联的所有文章*/
export async function getPostCategoryWithPosts(params?: Prisma.PostCategoryFindManyArgs) {
    try {
        const data = await prisma.postCategory.findMany({
            include: {
                posts: {
                    where: { status: 1 },
                    omit: { content: true },
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 6,
                    include: postWithUserInclude
                }
            },
            ...params,
            where: {status: 1, ...params?.where},
        }) as PostCategoryWithPosts[]
        return backSuccessMessage("获取分类列表成功", data)
    } catch {
        return backFailMessage("获取分类列表失败", [])
    }

}

export async function getPostCategoryById(id: string) {

}

export async function updatePostCategory(id: string, data: { title?: string, content?: string }) {

}

export async function deletePostCategory(id: string) {

}

/* ------------------------------------------------------------------ *
 * 后台：文章分类管理
 *
 * 与上面的前台接口分开命名（Admin 前缀），因为两者的鉴权、分页、
 * 返回形状完全不同：前台要「分类 + 前 6 篇文章」，后台要「一页分类 + 文章数」。
 * ------------------------------------------------------------------ */

/** 分类名称长度上限（与产品口径一致：1-20 字） */
const NAME_MAX = 20;

/** 后台列表行 */
export type AdminPostCategoryRow = {
    id: number
    name: string
    icon: string | null
    /** 0：禁用 1：正常 */
    status: number
    /** 该分类下的文章数 */
    postCount: number
    /** ISO 字符串：要跨 RSC 边界序列化 */
    createdAt: string
}

export type AdminPostCategoryList = {
    list: AdminPostCategoryRow[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

/**
 * 名称归一 + 基本校验。
 * 返回 null 表示不合法（空 / 超长 / 非字符串），由调用方给出统一文案。
 */
function normalizeCategoryName(raw: unknown): string | null {
    if (typeof raw !== "string") return null
    const name = raw.trim()
    if (name.length === 0 || name.length > NAME_MAX) return null
    return name
}

/** 名称是否已被别的分类占用（excludeId 用于编辑时排除自己） */
async function isCategoryNameTaken(name: string, excludeId?: number): Promise<boolean> {
    const found = await prisma.postCategory.findFirst({
        where: {
            name,
            ...(excludeId === undefined ? {} : {id: {not: excludeId}}),
        },
        select: {id: true},
    })
    return found !== null
}

/**
 * 写操作后的统一失效。
 *
 * 两处都要清：分类页自己（列表 / 文章数），以及文章列表页
 * （文章列表的筛选下拉用的是分类表，改名后不同步会显示旧名字）。
 */
function revalidateCategorySurfaces(): void {
    revalidatePath("/admin/posts/categories")
    revalidatePath("/admin/posts")
    revalidatePath("/blog", "layout")
    revalidatePath("/blog/article/list")
    revalidatePath("/sitemap.xml")
}

/**
 * 后台分类列表。
 *
 * PostCategory 没有 owner 列（分类是全站共用的字典数据），
 * 因此只校验页面权限，不需要额外接收数据范围参数。
 */
export async function getAdminPostCategoryList(
    params?: { keyword?: string; status?: AdminStatusFilter; page?: number; pageSize?: number },
): Promise<BaseResource<AdminPostCategoryList>> {
    const EMPTY: AdminPostCategoryList = {list: [], total: 0, page: 1, pageSize: 10, totalPages: 1};
    try {
        await requirePageAccess("postCategories")

        const {page, pageSize} = normalizePaging(params)
        const keyword = params?.keyword?.trim() ?? ""
        const status = params?.status ?? "all"

        const where: Prisma.PostCategoryWhereInput = {}
        if (keyword !== "") where.name = {contains: keyword, mode: "insensitive"}
        if (status === "1" || status === "0") where.status = Number(status)

        const [total, rows] = await Promise.all([
            prisma.postCategory.count({where}),
            prisma.postCategory.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    icon: true,
                    status: true,
                    createdAt: true,
                    // 文章数由 DB 一次聚合出来，避免 N+1
                    _count: {select: {posts: true}},
                },
                orderBy: [{createdAt: "desc"}, {id: "desc"}],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ])

        const list: AdminPostCategoryRow[] = rows.map((row) => ({
            id: row.id,
            name: row.name,
            icon: row.icon,
            status: row.status,
            postCount: row._count.posts,
            createdAt: row.createdAt.toISOString(),
        }))

        return backSuccessMessage("获取分类列表成功", {
            list,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        })
    } catch (error) {
        // 页面守卫里的 redirect 是控制流，不能被 catch 吃掉
        if (isRedirectError(error)) throw error
        console.warn("[service/postCategory] 读取后台分类列表失败", error)
        return backFailMessage("获取分类列表失败，请刷新页面重试", EMPTY)
    }
}

/** 新建分类：名称必填 1-20 字、trim、全局唯一 */
export async function createAdminPostCategory(input: {
    name: string
    icon?: string
    status?: number
}): Promise<BaseResource<null>> {
    try {
        await requireAction("postCategory:create")

        const name = normalizeCategoryName(input?.name)
        if (name === null) return backFailMessage(`分类名称需为 1-${NAME_MAX} 个字`)
        if (await isCategoryNameTaken(name)) return backFailMessage("分类名称已存在")

        const icon = typeof input?.icon === "string" && input.icon.trim() !== "" ? input.icon.trim() : null
        const status = input?.status === 0 ? 0 : 1

        await prisma.$transaction(async (tx) => {
            const category = await tx.postCategory.create({data: {name, icon, status}})
            const userRole = await tx.role.findUnique({where: {code: "user"}, select: {code: true}})
            if (userRole) {
                await tx.rolePermission.createMany({
                    data: [{roleCode: userRole.code, permissionKey: `blog:category:${category.id}`}],
                    skipDuplicates: true,
                })
            }
        })

        revalidateCategorySurfaces()
        return backSuccessMessage("分类已创建")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/postCategory] 创建分类失败", error)
        return backFailMessage("创建分类失败，请稍后再试")
    }
}

/** 编辑分类：名称（可选）同样校验唯一；没传的字段保持原值 */
export async function updateAdminPostCategory(input: {
    id: number
    name?: string
    icon?: string
    status?: number
}): Promise<BaseResource<null>> {
    try {
        await requireAction("postCategory:update")

        const id = Number(input?.id)
        if (!Number.isInteger(id) || id <= 0) return backFailMessage("分类不存在")

        const existing = await prisma.postCategory.findUnique({
            where: {id},
            select: {id: true, name: true, icon: true, status: true},
        })
        if (!existing) return backFailMessage("分类不存在，可能已被删除")

        let name = existing.name
        if (input?.name !== undefined) {
            const normalized = normalizeCategoryName(input.name)
            if (normalized === null) return backFailMessage(`分类名称需为 1-${NAME_MAX} 个字`)
            if (normalized !== existing.name && (await isCategoryNameTaken(normalized, id))) {
                return backFailMessage("分类名称已存在")
            }
            name = normalized
        }

        const icon = input?.icon !== undefined ? (input.icon.trim() || null) : existing.icon
        const status = input?.status === 0 || input?.status === 1 ? input.status : existing.status

        await prisma.postCategory.update({where: {id}, data: {name, icon, status}})

        revalidateCategorySurfaces()
        return backSuccessMessage("分类已更新")
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/postCategory] 更新分类失败", error)
        return backFailMessage("更新分类失败，请稍后再试")
    }
}

/**
 * 删除分类。
 *
 * 先查文章数再删：Post.categoryId 是外键（onDelete 未设级联），
 * 直接删会抛 DB 约束错（P2003），用户看到的是「删除失败」这种无信息量的提示。
 * 这里主动挡下来并告诉他还有多少篇，才知道下一步该干什么。
 */
export async function deleteAdminPostCategory(id: number): Promise<BaseResource<null>> {
    try {
        await requireAction("postCategory:delete")

        if (!Number.isInteger(id) || id <= 0) return backFailMessage("分类不存在")

        const existing = await prisma.postCategory.findUnique({
            where: {id},
            select: {id: true, name: true},
        })
        if (!existing) return backFailMessage("分类不存在，可能已被删除")

        const postCount = await prisma.post.count({where: {categoryId: id}})
        if (postCount > 0) {
            return backFailMessage(`该分类下还有 ${postCount} 篇文章，请先迁移或删除`)
        }

        await prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({where: {permissionKey: `blog:category:${id}`}})
            await tx.postCategory.delete({where: {id}})
        })

        revalidateCategorySurfaces()
        return backSuccessMessage(`已删除分类「${existing.name}」`)
    } catch (error) {
        if (isRedirectError(error)) throw error
        console.warn("[service/postCategory] 删除分类失败", error)
        return backFailMessage("删除分类失败，请稍后再试")
    }
}
