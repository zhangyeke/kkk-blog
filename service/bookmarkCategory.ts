"use server"

import { merge } from "lodash"
import { updateTag } from "next/cache"
import { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { checkAuth } from "@/service/auth"
import { addBookmarkCategorySchema } from "@/validators/bookmark"
import { BookmarkCategoryWithBookmarks } from "@/types/bookmark"

// --- CREATE ---

export async function createBookmarkCategory(data: Prisma.BookmarkCategoryCreateInput) {
  try {
    await checkAuth()
    const params = addBookmarkCategorySchema.parse(data)
    const category = await prisma.bookmarkCategory.create({
      data: {
        name: params.name,
        ...(params.status !== undefined ? { status: params.status } : {}),
      },
    })
    updateTag("action-bookmarkCategoryList")
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
    updateTag("action-bookmarkCategoryList")
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
    updateTag("action-bookmarkCategoryList")
    updateTag("action-bookmarkList")
    return backSuccessMessage("删除书签分类成功", deleted)
  } catch {
    return backFailMessage("删除书签分类失败")
  }
}
