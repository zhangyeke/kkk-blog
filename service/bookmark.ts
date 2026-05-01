"use server"

import { merge } from "lodash"
import { updateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { checkAuth } from "@/service/auth"
import { addBookmarkSchema } from "@/validators/bookmark"

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

    updateTag("action-bookmarkList")
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
    updateTag("action-bookmarkList")
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
    updateTag("action-bookmarkList")
    return backSuccessMessage("删除书签成功", deleted)
  } catch {
    return backFailMessage("删除书签失败")
  }
}
