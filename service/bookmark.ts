"use server"

import { merge } from "lodash"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction, scopeOf } from "@/lib/admin-guard"
import { checkAuth } from "@/service/auth"
import { addBookmarkSchema } from "@/validators/bookmark"
import { normalizePaging, type Paging } from "@/lib/paging"
import type { DataScope } from "@/lib/permissions"

const bookmarkScopeWhere = (scope: DataScope) => (scope.all ? {} : { userId: scope.userId })

async function resolveCategoryOrFail(categoryId: number) {
  const category = await prisma.bookmarkCategory.findFirst({
    where: { id: categoryId, status: 1 },
    select: { id: true },
  })
  if (!category) {
    return null
  }
  return category
}

// --- CREATE ---

export async function createBookmark(data: Prisma.BookmarkCreateInput) {
  try {
    const user = await checkAuth()
    const params = addBookmarkSchema.parse(data)
    const category = await resolveCategoryOrFail(params.categoryId)
    if (!category) {
      return backFailMessage("书签分类不存在或已禁用")
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        ...params,
        userId: user.id || "",
      },
    })

    return backSuccessMessage("创建书签成功", bookmark)
  } catch {
    return backFailMessage("创建书签失败")
  }
}

// --- READ ---

export async function getMeBookmarks(params: Prisma.BookmarkWhereInput & Paging) {
  try {
    const user = await checkAuth()
    const { page, pageSize, ...where } = params

    const mergedWhere = merge({ userId: user.id as string }, where)

    const list = await prisma.bookmark.findMany({
      where: mergedWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
      },
    })

    const totalCount = await prisma.bookmark.count({
      where: mergedWhere,
    })

    return backSuccessMessage("获取我的书签列表成功", {
      list,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    })
  } catch {
    return backFailMessage("获取我的书签列表失败", {
      list: [],
      totalPages: 0,
      currentPage: 0,
    })
  }
}

export async function getBookmarkById(id: number) {
  try {
    const user = await checkAuth()

    if (!Number.isInteger(id) || id <= 0) {
      return backFailMessage("书签 ID 不合法")
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!bookmark) {
      return backFailMessage("书签不存在")
    }
    if (bookmark.userId !== user.id) {
      return backFailMessage("无权查看该书签")
    }

    return backSuccessMessage("获取书签成功", bookmark)
  } catch {
    return backFailMessage("获取书签失败")
  }
}

// --- UPDATE ---

export async function updateBookmark({ id, ...data }: Prisma.BookmarkUpdateInput & { id: number }) {
  try {
    await checkAuth()
    const bookmark = await prisma.bookmark.update({
      where: { id },
      data,
    })
    return backSuccessMessage("更新书签成功", bookmark)
  } catch {
    return backFailMessage("更新书签失败")
  }
}

// --- DELETE ---

export async function deleteBookmark(id: number) {
  try {
    if (!Number.isInteger(id) || id <= 0) {
      return backFailMessage("书签 ID 不合法")
    }

    const user = await checkAuth()

    const row = await prisma.bookmark.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })
    if (!row) {
      return backFailMessage("书签不存在")
    }
    if (row.userId !== user.id) {
      return backFailMessage("无权删除该书签")
    }

    const deleted = await prisma.bookmark.delete({ where: { id } })
    return backSuccessMessage("删除书签成功", deleted)
  } catch {
    return backFailMessage("删除书签失败")
  }
}

// ==================== 后台管理 ====================
// 与上面的前台 action 共用同一个 Prisma 模型和响应结构，区别只在：
// 前台用 checkAuth + 归属自己的数据；后台走 RBAC（requireAction）+ scopeOf 数据范围。

export type AdminBookmarkRow = {
  id: number
  title: string
  url: string
  icon: string | null
  status: number
  categoryName: string
  categoryId: number
  intro: string | null
  createdAt: Date
}

export async function getAdminBookmarks(
  scope: DataScope,
  options?: Partial<Paging> & { title?: string; categoryId?: number; status?: number },
) {
  try {
    const { page, pageSize } = normalizePaging(options)
    const where = {
      ...bookmarkScopeWhere(scope),
      ...(options?.title ? { title: { contains: options.title, mode: "insensitive" as const } } : {}),
      ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options?.status === 0 || options?.status === 1 ? { status: options.status } : {}),
    }

    const [total, rows] = await Promise.all([
      prisma.bookmark.count({ where }),
      prisma.bookmark.findMany({
        where,
        select: {
          id: true,
          title: true,
          url: true,
          icon: true,
          status: true,
          intro: true,
          categoryId: true,
          createdAt: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const list: AdminBookmarkRow[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      icon: row.icon,
      status: row.status,
      intro: row.intro,
      categoryId: row.categoryId,
      createdAt: row.createdAt,
      categoryName: row.category?.name ?? "未分类",
    }))

    return backSuccessMessage("获取书签列表成功", {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch {
    return backFailMessage("获取书签列表失败", {
      list: [] as AdminBookmarkRow[],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    })
  }
}

/** 新增 / 编辑书签（后台）。共享 `addBookmarkSchema` 带 icon，只在传了字符串时才写库。 */
export async function saveAdminBookmark(input: {
  id?: number; title: string; url: string; intro?: string; icon?: string; categoryId: number; status: 0 | 1
}) {
  const user = await requireAction(input.id ? "bookmark:update" : "bookmark:create")
  const title = input.title.trim()
  const icon = typeof input.icon === "string" ? input.icon.trim() : undefined
  if (!title || title.length > 100) return backFailMessage("标题需为 1-100 个字")
  let url: string
  try {
    url = new URL(input.url.trim()).toString()
    if (!/^https?:/.test(url)) return backFailMessage("仅支持 HTTP 或 HTTPS 链接")
  } catch { return backFailMessage("请输入有效链接") }
  if (input.status !== 0 && input.status !== 1) return backFailMessage("状态不合法")
  const category = await prisma.bookmarkCategory.findUnique({
    where: { id: input.categoryId }, select: { id: true, status: true },
  })
  if (!category || category.status !== 1) return backFailMessage("书签分类不存在或已禁用")
  if (input.id) {
    const existing = await prisma.bookmark.findUnique({ where: { id: input.id }, select: { userId: true } })
    if (!existing) return backFailMessage("书签不存在")
    if (!scopeOf(user).all && existing.userId !== user.id) return backFailMessage("无权编辑该书签")
    await prisma.bookmark.update({
      where: { id: input.id },
      data: {
        title, url, intro: input.intro?.trim() ?? "", categoryId: input.categoryId, status: input.status,
        ...(icon !== undefined ? { icon } : {}),
      },
    })
  } else {
    await prisma.bookmark.create({
      data: {
        title, url, intro: input.intro?.trim() ?? "", icon: icon ?? "",
        categoryId: input.categoryId, status: input.status, userId: user.id,
      },
    })
  }
  revalidatePath("/admin/bookmarks")
  revalidatePath("/blog", "layout")
  return backSuccessMessage(input.id ? "书签已更新" : "书签已创建", null)
}

export async function deleteAdminBookmark(id: number) {
  const user = await requireAction("bookmark:delete")
  const existing = await prisma.bookmark.findUnique({ where: { id }, select: { userId: true } })
  if (!existing) return backFailMessage("书签不存在")
  if (!scopeOf(user).all && existing.userId !== user.id) return backFailMessage("无权删除该书签")
  await prisma.bookmark.delete({ where: { id } })
  revalidatePath("/admin/bookmarks")
  revalidatePath("/blog", "layout")
  return backSuccessMessage("书签已删除", null)
}

/**
 * 启用 / 禁用书签。
 * 不复用 `saveAdminBookmark`：那条路径要重传整张表单，只为改 status 容易误覆盖陈旧数据。
 * 传目标状态而不是切换开关，重复点击幂等。
 */
export async function updateAdminBookmarkStatus(id: number, status: 0 | 1) {
  try {
    const user = await requireAction("bookmark:update")
    if (!Number.isSafeInteger(id) || id <= 0) return backFailMessage("书签不存在")
    if (status !== 0 && status !== 1) return backFailMessage("状态不合法")
    const existing = await prisma.bookmark.findUnique({
      where: { id }, select: { userId: true, status: true },
    })
    if (!existing) return backFailMessage("书签不存在")
    if (!scopeOf(user).all && existing.userId !== user.id) return backFailMessage("无权修改该书签")
    if (existing.status === status) return backSuccessMessage("状态未变化", null)

    await prisma.bookmark.update({ where: { id }, data: { status } })
    revalidatePath("/admin/bookmarks")
    revalidatePath("/blog", "layout")
    return backSuccessMessage(status === 1 ? "已启用" : "已禁用", null)
  } catch (error) {
    // 未登录时 requireAction 会 redirect("/login")，吞掉就只剩一句「操作失败」
    if (isRedirectError(error)) throw error
    return backFailMessage("操作失败，请稍后再试")
  }
}
