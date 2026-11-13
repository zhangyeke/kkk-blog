"use server"

import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction, requirePageAccess } from "@/lib/admin-guard"
import { normalizePaging } from "@/lib/paging"
import { checkAuth } from "@/service/auth"
import { bookmarkCategorySchema } from "@/validators/bookmarkCategory"
import { BookmarkCategoryWithBookmarks } from "@/types/bookmark"

// --- CREATE ---

export async function createBookmarkCategory(data: Prisma.BookmarkCategoryCreateInput) {
  try {
    await checkAuth()
    const params = bookmarkCategorySchema.parse(data)
    const category = await prisma.bookmarkCategory.create({
      data: {
        name: params.name,
        ...(params.status !== undefined ? { status: params.status } : {}),
      },
    })
    return backSuccessMessage("创建书签分类成功", category)
  } catch {
    return backFailMessage("创建书签分类失败")
  }
}

// --- READ ---

export async function getBookmarkCategoryList(params?: Prisma.BookmarkCategoryFindManyArgs) {
  try {
    const list = await prisma.bookmarkCategory.findMany({
      orderBy: { id: "asc" },
      ...params,
    })
    return backSuccessMessage("获取书签分类列表成功", list as BookmarkCategoryWithBookmarks[])
  } catch {
    return backFailMessage("获取书签分类列表失败", [])
  }
}

export async function getBookmarkCategoryById(id: number) {
  try {
    if (!Number.isInteger(id) || id <= 0) {
      return backFailMessage("分类 ID 不合法")
    }
    const category = await prisma.bookmarkCategory.findUnique({
      where: { id },
    })
    if (!category) {
      return backFailMessage("书签分类不存在")
    }
    return backSuccessMessage("获取书签分类成功", category)
  } catch {
    return backFailMessage("获取书签分类失败")
  }
}

// --- UPDATE ---

export async function updateBookmarkCategory({ id, ...data }: Prisma.BookmarkCategoryUpdateInput & { id: number }) {
  try {
    await checkAuth()
    const category = await prisma.bookmarkCategory.update({
      where: { id },
      data,
    })
    return backSuccessMessage("更新书签分类成功", category)
  } catch {
    return backFailMessage("更新书签分类失败")
  }
}

// --- DELETE ---

/** 删除分类会连同其书签一并删除（见 Prisma FK onDelete Cascade） */
export async function deleteBookmarkCategory(id: number) {
  try {
    await checkAuth()
    if (!Number.isInteger(id) || id <= 0) {
      return backFailMessage("分类 ID 不合法")
    }
    const row = await prisma.bookmarkCategory.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!row) {
      return backFailMessage("书签分类不存在")
    }
    const deleted = await prisma.bookmarkCategory.delete({ where: { id } })
    return backSuccessMessage("删除书签分类成功", deleted)
  } catch {
    return backFailMessage("删除书签分类失败")
  }
}

// ==================== 后台管理 ====================
// 前台 action 走 checkAuth + 归属校验；后台走 RBAC + 全量数据范围，并带分页列表。

/** 后台分类列表：按名称模糊搜索、按状态筛选，附带每个分类下的书签数 */
export async function getAdminBookmarkCategories(options?: { page?: number; pageSize?: number; keyword?: string; status?: string }) {
  await requirePageAccess("bookmarkCategories")
  const { page, pageSize } = normalizePaging(options)
  const where = {
    ...(options?.keyword?.trim() ? { name: { contains: options.keyword.trim(), mode: "insensitive" as const } } : {}),
    ...(options?.status === "0" || options?.status === "1" ? { status: Number(options.status) } : {}),
  }
  const [total, rows] = await Promise.all([
    prisma.bookmarkCategory.count({ where }),
    prisma.bookmarkCategory.findMany({
      where, orderBy: { id: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      include: { _count: { select: { bookmarks: true } } },
    }),
  ])
  return {
    list: rows.map(({ _count, ...row }) => ({ ...row, bookmarkCount: _count.bookmarks })),
    total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function saveAdminBookmarkCategory(input: { id?: number; name: string; status: 0 | 1 }) {
  await requireAction(input.id ? "bookmarkCategory:update" : "bookmarkCategory:create")
  const name = input.name.trim()
  if (!name || name.length > 100) return backFailMessage("分类名称需为 1-100 个字")
  if (input.status !== 0 && input.status !== 1) return backFailMessage("状态不合法")
  const duplicate = await prisma.bookmarkCategory.findFirst({
    where: { name, ...(input.id ? { id: { not: input.id } } : {}) }, select: { id: true },
  })
  if (duplicate) return backFailMessage("分类名称已存在")
  if (input.id) {
    const existing = await prisma.bookmarkCategory.findUnique({ where: { id: input.id }, select: { id: true } })
    if (!existing) return backFailMessage("分类不存在")
    await prisma.bookmarkCategory.update({ where: { id: input.id }, data: { name, status: input.status } })
  } else {
    await prisma.bookmarkCategory.create({ data: { name, status: input.status } })
  }
  revalidatePath("/admin/bookmarks/categories")
  revalidatePath("/admin/bookmarks")
  revalidatePath("/blog", "layout")
  return backSuccessMessage(input.id ? "分类已更新" : "分类已创建", null)
}

export async function deleteAdminBookmarkCategory(id: number) {
  await requireAction("bookmarkCategory:delete")
  const count = await prisma.bookmark.count({ where: { categoryId: id } })
  if (count > 0) return backFailMessage(`该分类下还有 ${count} 个书签，请先迁移或删除`)
  await prisma.bookmarkCategory.delete({ where: { id } })
  revalidatePath("/admin/bookmarks/categories")
  revalidatePath("/blog", "layout")
  return backSuccessMessage("分类已删除", null)
}
