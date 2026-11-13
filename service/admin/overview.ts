"use server"

import type { Prisma } from "@prisma/client"

import prisma from "@/lib/prisma"
import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import type { DataScope } from "@/lib/permissions"

export type AdminOverview = {
  postTotal: number
  postPublished: number
  postDraft: number
  viewTotal: number
  favoriteTotal: number
  bookmarkTotal: number
  footprintTotal: number
  userTotal: number
  bookmarkClicksAvailable: boolean
  topPosts: Array<{ id: number; title: string; pv: number | null; updatedAt: Date }>
  topBookmarks: Array<{ id: number; title: string; url: string; intro: string | null; clickCount: number }>
  recentFootprints: Array<{ id: number; address: string | null; photoCount: number; createdAt: Date }>
}

const EMPTY_OVERVIEW: AdminOverview = {
  postTotal: 0,
  postPublished: 0,
  postDraft: 0,
  viewTotal: 0,
  favoriteTotal: 0,
  bookmarkTotal: 0,
  footprintTotal: 0,
  userTotal: 0,
  bookmarkClicksAvailable: true,
  topPosts: [],
  topBookmarks: [],
  recentFootprints: [],
}

export async function getAdminOverview(scope: DataScope) {
  try {
    const where: Prisma.PostWhereInput = scope.all ? {} : { userId: scope.userId }
    const bookmarkWhere: Prisma.BookmarkWhereInput = scope.all ? {} : { userId: scope.userId }
    const footprintWhere: Prisma.FootprintWhereInput = scope.all ? {} : { userId: scope.userId }

    const [postTotal, postPublished, postDraft, viewAgg, favoriteAgg, bookmarkTotal, footprintTotal, userTotal, topPosts, topBookmarkRows, footprintRows] =
      await Promise.all([
        prisma.post.count({ where }),
        prisma.post.count({ where: { ...where, status: 1 } }),
        prisma.post.count({ where: { ...where, status: 2 } }),
        prisma.post.aggregate({ where, _sum: { pv: true } }),
        prisma.post.aggregate({ where, _sum: { favoriteCount: true } }),
        prisma.bookmark.count({ where: bookmarkWhere }),
        prisma.footprint.count({ where: footprintWhere }),
        scope.all ? prisma.user.count() : Promise.resolve(0),
        prisma.post.findMany({
          where: { ...where, status: 1 },
          select: { id: true, title: true, pv: true, updatedAt: true },
          orderBy: [{ pv: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
          take: 5,
        }),
        prisma.bookmark.findMany({
          where: { ...bookmarkWhere, status: 1 },
          select: { id: true, title: true, url: true, intro: true, clickCount: true },
          orderBy: [{ clickCount: "desc" }, { updatedAt: "desc" }],
          take: 5,
        }).catch((error: unknown) => {
          console.error("[admin-overview] 读取热门书签失败", error)
          return null
        }),
        prisma.footprint.findMany({
          where: footprintWhere,
          select: { id: true, address: true, album: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ])

    const data: AdminOverview = {
      postTotal,
      postPublished,
      postDraft,
      viewTotal: viewAgg._sum.pv ?? 0,
      favoriteTotal: favoriteAgg._sum.favoriteCount ?? 0,
      bookmarkTotal,
      footprintTotal,
      userTotal,
      bookmarkClicksAvailable: topBookmarkRows !== null,
      topPosts,
      topBookmarks: topBookmarkRows ?? [],
      recentFootprints: footprintRows.map((row) => ({
        id: row.id,
        address: row.address,
        photoCount: row.album.length,
        createdAt: row.createdAt,
      })),
    }
    return backSuccessMessage("获取概览成功", data)
  } catch (error) {
    console.error("[admin-overview] 读取概览数据失败", error)
    return backFailMessage("获取概览失败", EMPTY_OVERVIEW)
  }
}
