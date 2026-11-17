import "server-only"

import { cache } from "react"

import { getMenuRows } from "@/lib/admin/menu-store"
import { addBlogCategoryMenuRows } from "@/lib/blog/menu"
import prisma from "@/lib/prisma"

/** Blog static menu entries and generated category links, deduplicated within each RSC request. */
export const getBlogMenuRows = cache(async () => {
  const [menuRows, categories] = await Promise.all([
    getMenuRows("BLOG"),
    prisma.postCategory.findMany({
      select: { id: true, name: true, status: true, icon: true },
      orderBy: [{ id: "asc" }],
    }).catch(() => []),
  ])
  return addBlogCategoryMenuRows(menuRows, categories)
})
