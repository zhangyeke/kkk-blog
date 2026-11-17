import type { MetadataRoute } from "next"
import prisma from "@/lib/prisma"
import { absoluteSiteUrl, articleListPath, articlePath } from "@/lib/seo/site"
import { getAllowedKeys } from "@/lib/admin/permission-store"
import { BLOG_PAGE_KEYS } from "@/lib/blog/permissions"

export const revalidate = 3600

const publicRoutes: Array<{path: string; key: string}> = [
  {path: "/blog", key: BLOG_PAGE_KEYS.home},
  {path: "/blog/article/list", key: BLOG_PAGE_KEYS.articleList},
  {path: "/blog/bookmark", key: BLOG_PAGE_KEYS.bookmarks},
  {path: "/blog/travel/map", key: BLOG_PAGE_KEYS.travelMap},
  {path: "/blog/jiangshan-map", key: BLOG_PAGE_KEYS.jiangshanMap},
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const allowedKeys = new Set(await getAllowedKeys("user"))
    const allowedCategoryIds = [...allowedKeys]
      .map((key) => /^blog:category:(\d+)$/.exec(key)?.[1])
      .filter((id): id is string => id != null)
      .map(Number)
    const staticEntries: MetadataRoute.Sitemap = publicRoutes
      .filter((route) => allowedKeys.has(route.key))
      .map(({path}) => ({url: absoluteSiteUrl(path)}))

    if (allowedCategoryIds.length === 0) return staticEntries

    const [categories, posts] = await Promise.all([
      prisma.postCategory.findMany({
        where: {
          status: 1,
          id: {in: allowedCategoryIds},
          posts: { some: { status: 1 } },
        },
        select: { id: true, updatedAt: true },
        orderBy: { id: "asc" },
      }),
      prisma.post.findMany({
        where: { status: 1, categoryId: {in: allowedCategoryIds} },
        select: { id: true },
        orderBy: { id: "asc" },
      }),
    ])

    const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
      url: absoluteSiteUrl(articleListPath({ categoryId: category.id })),
      lastModified: category.updatedAt,
    }))
    const articleEntries: MetadataRoute.Sitemap = posts.map((post) => ({
      url: absoluteSiteUrl(articlePath(post.id)),
    }))

    return [...staticEntries, ...categoryEntries, ...articleEntries]
  } catch (error) {
    console.error("[seo] Failed to read sitemap entries", error)
    return []
  }
}
