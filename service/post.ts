"use server"
import { cache } from "react"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { PostListItem, postListSelect, PostPayload, PostWithFavorites, postWithUserInclude } from "@/types/post"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { checkAuth } from "@/service/auth"
import { postPayloadSchema } from "@/validators/post"
import { getPlainText } from "@/lib/markdown"
import { after } from "next/server"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireAction, scopeOf } from "@/lib/admin-guard"
import { normalizePaging, type Paging } from "@/lib/paging"
import type { DataScope } from "@/lib/permissions"

const postScopeWhere = (scope: DataScope) => (scope.all ? {} : { userId: scope.userId })

// --- CREATE (新增) ---
export async function createPost(data: PostPayload) {
  try {
    // 1. 拦截未登录（抛出 ActionError）
    const user = await checkAuth()
    // status 未传时不塞默认值，交给 DB 默认值（status = 1）
    const params = postPayloadSchema.parse(data)

    // 2. 数据库操作（如果失败会抛出 Prisma 错误）
    const post = await prisma.post.create({
      data: {
        ...params,
        userId: user.id || "",
      },
    })

    return backSuccessMessage("创建文章成功", post)
  } catch {
    return backFailMessage("创建文章失败")
  }
}

// --- READ (查询) ---
// 获取所有文章
export async function getAllPosts(params?: Prisma.PostFindManyArgs) {
  try {
    const posts = await prisma.post.findMany({
      where: { AND: [{ status: 1 }, params?.where || {}] },
      orderBy: params?.orderBy || [{ createdAt: "desc" }, { id: "desc" }],
      skip: params?.skip,
      take: params?.take,
      select: postListSelect,
    })

    const postsWithSummary = (await Promise.all(
      posts.map(async ({ content, ...post }) => {
        return {
          ...post,
          // 增加一个 summary 字段
          summary: await getPlainText(content || ""),
        }
      })
    )) as PostListItem[]
    return backSuccessMessage("获取文章列表成功", postsWithSummary)
  } catch {
    return backFailMessage("获取文章列表失败", [])
  }
}

/*获取函数的返回值类型*/
// export type GetAllPostsResponse = Awaited<ReturnType<typeof getAllPosts>>;

/*分页查询文章*/
export async function getPostsByPage(params: Prisma.PostFindManyArgs & Paging) {
  try {
    const { page, pageSize, where: filter, orderBy } = params
    validatePaging(page, pageSize)
    const where: Prisma.PostWhereInput = { AND: [{ status: 1 }, filter || {}] }
    const [posts, totalCount] = await Promise.all([
      getAllPosts({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.post.count({ where }),
    ])
    if (posts.code !== 200) throw new Error(posts.message)
    return backSuccessMessage("获取文章列表成功", {
      list: posts.data,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    })
  } catch {
    return backFailMessage("获取文章列表失败", {
      list: [],
      totalPages: 0,
      currentPage: 0,
    })
  }
}

/*查询登录用户的文章列表*/
export async function getMePosts(params: Prisma.PostWhereInput & Paging) {
  try {
    const user = await checkAuth()
    const { page, pageSize, ...where } = params

    validatePaging(page, pageSize)
    const mergedWhere: Prisma.PostWhereInput = { AND: [{ userId: user.id, status: 1 }, where] }
    const [posts, totalCount] = await Promise.all([
      getAllPosts({
        where: mergedWhere,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where: mergedWhere }),
    ])
    if (posts.code !== 200) throw new Error(posts.message)

    return backSuccessMessage("获取我的文章列表成功", {
      list: posts.data,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    })
  } catch {
    return backFailMessage("获取我的文章列表失败", {
      list: [],
      totalPages: 0,
      currentPage: 0,
    })
  }
}

// --- UPDATE (更新) ---
export async function updatePost({ id, ...params }: PostPayload & { id: number }) {
  try {
    // 1. 拦截未登录（抛出 ActionError）
    const user = await checkAuth()
    if (!Number.isSafeInteger(id) || id <= 0) return backFailMessage("文章 ID 不合法")
    // status 未传时是 undefined，Prisma update 会自动跳过该字段
    const data = postPayloadSchema.parse(params)

    const post = await prisma.post.update({
      where: { id, userId: user.id },
      data,
    })
    return backSuccessMessage("更新文章成功", post)
  } catch {
    return backFailMessage("更新文章失败")
  }
}

// 根据 ID 获取单篇文章
const readPostById = cache(async (id: number) => {
  try {
    if (!Number.isSafeInteger(id) || id <= 0) return backFailMessage("文章不存在")
    // 1. 获取当前登录用户会话
    const session = await auth()
    const currentUserId = session?.user?.id

    const post = (await prisma.post.findUnique({
      where: { id },
      include: {
        ...postWithUserInclude,
        // 如果用户已登录，我们尝试查一下他是否收藏了这篇文章
        favorites: currentUserId
          ? {
              where: {
                userId: currentUserId,
              },
              take: 1,
            }
          : false,
      },
    })) as PostWithFavorites

    if (!post || (post.status !== 1 && post.userId !== currentUserId)) {
      return backFailMessage("文章不存在")
    }

    // 为了保持 PostWithUser 类型的整洁，我们可以解构掉 favorites
    const { favorites, ...postData } = post
    // 如果 favorites 数组长度大于 0，说明当前用户已收藏
    const isFavorite = Array.isArray(favorites) && favorites.length > 0

    after(async () => {
      try {
        await prisma.post.update({ where: { id }, data: { pv: { increment: 1 } } })
      } catch {
        console.error("[post] Failed to update view count", { id })
      }
    })

    return backSuccessMessage("获取文章成功", {
      ...postData,
      isFavorite,
    } as PostWithFavorites & { isFavorite: boolean })
  } catch {
    return backFailMessage("文章不存在")
  }
})

// Metadata and the page body share one read and one view update per server render.
export async function getPostById(id: number) {
  return readPostById(id)
}

function validatePaging(page: number, pageSize: number) {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw new Error("分页参数不合法")
  }
}

// --- DELETE (删除) ---
export async function deletePost(postId: number) {
  try {
    if (!Number.isInteger(postId) || postId <= 0) {
      return backFailMessage("文章 ID 不合法")
    }

    const user = await checkAuth()

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!post) {
      return backFailMessage("文章不存在")
    }

    if (post.userId !== user.id) {
      return backFailMessage("无权删除这篇文章")
    }

    const deletedPost = await prisma.post.delete({
      where: { id: postId },
    })

    return backSuccessMessage("删除文章成功", deletedPost)
  } catch {
    return backFailMessage("删除文章失败")
  }
}

export type AdminPostRow = {
  id: number
  title: string
  cover: string
  status: number | null
  pv: number | null
  favoriteCount: number
  updatedAt: Date
  categoryName: string
  authorName: string
}

export type AdminPostFilters = {
  status?: number
  title?: string
  categoryId?: number
  authorId?: string
}

export async function getAdminPosts(scope: DataScope, options?: Partial<Paging> & AdminPostFilters) {
  try {
    const { page, pageSize } = normalizePaging(options)
    const where = {
      ...postScopeWhere(scope),
      ...(options?.status != null ? { status: options.status } : {}),
      ...(options?.title ? { title: { contains: options.title, mode: "insensitive" as const } } : {}),
      ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options?.authorId && scope.all ? { userId: options.authorId } : {}),
    }

    const [total, rows] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          cover: true,
          status: true,
          pv: true,
          favoriteCount: true,
          updatedAt: true,
          category: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const list: AdminPostRow[] = rows.map((row) => ({
      id: row.id,
      title: row.title || "未命名文章",
      cover: row.cover,
      status: row.status,
      pv: row.pv,
      favoriteCount: row.favoriteCount,
      updatedAt: row.updatedAt,
      categoryName: row.category?.name ?? "未分类",
      authorName: row.user?.name ?? "未知",
    }))

    return backSuccessMessage("获取文章列表成功", {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch {
    return backFailMessage("获取文章列表失败", {
      list: [] as AdminPostRow[],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
  }
}

export async function deleteAdminPost(id: number) {
  try {
    const user = await requireAction("post:delete")
    const scope = scopeOf(user)
    const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } })
    if (!post) return backFailMessage("文章不存在")
    if (!scope.all && post.userId !== scope.userId) return backFailMessage("只能删除自己的文章")

    await prisma.post.delete({ where: { id } })
    revalidatePath("/admin/posts")
    revalidatePath("/admin")
    return backSuccessMessage("已删除")
  } catch {
    return backFailMessage("删除失败，可能没有权限")
  }
}

export async function updateAdminPostStatus(id: number, status: 0 | 1): Promise<BaseResource<null>> {
  try {
    const user = await requireAction("post:update")
    const scope = scopeOf(user)
    if (!Number.isSafeInteger(id) || id <= 0) return backFailMessage("文章 ID 不合法")
    if (status !== 0 && status !== 1) return backFailMessage("状态值不合法")

    const post = await prisma.post.findUnique({ where: { id }, select: { userId: true, status: true } })
    if (!post) return backFailMessage("文章不存在，可能已被删除")
    if (!scope.all && post.userId !== scope.userId) return backFailMessage("只能修改自己的文章")
    if (post.status === status) return backSuccessMessage("状态未变化")

    await prisma.post.update({ where: { id }, data: { status } })
    revalidatePath("/admin/posts")
    revalidatePath("/admin")
    revalidatePath("/blog")
    return backSuccessMessage(status === 1 ? "已发布" : "已下架")
  } catch (error) {
    if (isRedirectError(error)) throw error
    console.warn("[service/post] 更新文章状态失败", error)
    return backFailMessage("操作失败，请稍后再试")
  }
}

export type AdminPostEditData = PostWithFavorites & { isFavorite: boolean }

export async function getAdminPostForEdit(id: number): Promise<BaseResource<AdminPostEditData>> {
  try {
    const user = await requireAction("post:update")
    const scope = scopeOf(user)
    if (!Number.isSafeInteger(id) || id <= 0) {
      return backFailMessage("文章 ID 不合法", null as unknown as AdminPostEditData)
    }

    const post = (await prisma.post.findUnique({
      where: { id },
      include: {
        ...postWithUserInclude,
        favorites: { where: { userId: user.id }, take: 1 },
      },
    })) as PostWithFavorites | null

    if (!post) return backFailMessage("文章不存在", null as unknown as AdminPostEditData)
    if (!scope.all && post.userId !== scope.userId) {
      return backFailMessage("只能编辑自己的文章", null as unknown as AdminPostEditData)
    }
    const { favorites, ...postData } = post
    const isFavorite = Array.isArray(favorites) && favorites.length > 0
    return backSuccessMessage("获取文章成功", { ...postData, isFavorite } as AdminPostEditData)
  } catch {
    return backFailMessage("获取文章详情失败，可能没有权限", null as unknown as AdminPostEditData)
  }
}

export async function getAdminPostFilterOptions(scope: DataScope) {
  try {
    const [categories, authors] = await Promise.all([
      prisma.postCategory.findMany({ select: { id: true, name: true }, orderBy: { id: "asc" } }),
      scope.all
        ? prisma.user.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "asc" } })
        : Promise.resolve([] as Array<{ id: string; name: string }>),
    ])
    return backSuccessMessage("获取筛选项成功", { categories, authors })
  } catch {
    return backFailMessage("获取筛选项失败", {
      categories: [] as Array<{ id: number; name: string }>,
      authors: [] as Array<{ id: string; name: string }>,
    })
  }
}
