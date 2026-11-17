import "server-only"

import { cache } from "react"
import { notFound } from "next/navigation"

import { auth } from "@/lib/auth"
import { getAllowedKeys } from "@/lib/admin/permission-store"
import { getBlogMenuRows } from "@/lib/blog/menu-store"
import { getBlogAccountMenu } from "@/lib/blog/account-menu"

export const BLOG_PAGE_KEYS = {
  home: "blog:page:home",
  start: "blog:page:start",
  articleList: "blog:page:article-list",
  bookmarks: "blog:page:bookmarks",
  jiangshanMap: "blog:page:jiangshan-map",
  travelMap: "blog:page:travel-map",
} as const

export type BlogAccess = { roles: string; keys: ReadonlySet<string>; categoryIds: ReadonlySet<number> }

const loadBlogAccess = cache(async (): Promise<BlogAccess> => {
  const session = await auth()
  const rawRoles = typeof session?.user?.roles === "string" ? session.user.roles.trim() : ""
  // Only anonymous visitors receive the public `user` role by default. A logged-in account
  // with no role assignment gets an empty permission set instead of inheriting `user`.
  const roles = session ? (rawRoles || "__authenticated_without_role__") : "user"
  const keys = new Set(await getAllowedKeys(roles))
  const categoryIds = new Set<number>()
  for (const key of keys) {
    const match = /^blog:category:(\d+)$/.exec(key)
    if (match) categoryIds.add(Number(match[1]))
  }
  return { roles, keys, categoryIds }
})

export const getBlogAccess = loadBlogAccess

export async function requireBlogPageAccess(key: string): Promise<BlogAccess> {
  const access = await getBlogAccess()
  if (!access.keys.has(key)) notFound()
  return access
}

export async function requireBlogCategoryAccess(categoryId: number): Promise<BlogAccess> {
  const access = await getBlogAccess()
  if (!Number.isSafeInteger(categoryId) || !access.categoryIds.has(categoryId)) notFound()
  return access
}

export async function requireBlogPathAccess(path: string): Promise<BlogAccess> {
  const row = (await getBlogMenuRows()).find(
    (item) => item.type === "menu" && item.status === 1 && item.path === path && item.permissionKey,
  )
  if (!row?.permissionKey) notFound()
  return requireBlogPageAccess(row.permissionKey)
}

/** Require a route to remain an active, role-authorized entry in the account dropdown. */
export async function requireBlogAccountPathAccess(path: string): Promise<BlogAccess> {
  const [rows, access] = await Promise.all([getBlogMenuRows(), getBlogAccess()])
  const { items } = getBlogAccountMenu(rows, access.keys)
  if (!items.some((item) => item.href === path)) notFound()
  return access
}
