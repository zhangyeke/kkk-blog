import type { AdminMenuRow } from "@/lib/admin/menu-seed"

export const BLOG_CATEGORY_GROUP_MARKER = "blog-category-group"
export const BLOG_ACCOUNT_MENU_GROUP_MARKER = "blog-account-menu-group"

/** Add read-only menu rows for categories under the configured blog category directory. */
export function addBlogCategoryMenuRows(
  menuRows: readonly AdminMenuRow[],
  categories: readonly { id: number; name: string; status: number; icon?: string | null }[],
): AdminMenuRow[] {
  const group = menuRows.find((row) => row.componentName === BLOG_CATEGORY_GROUP_MARKER)
  if (!group) return [...menuRows]

  return [
    ...menuRows,
    ...categories.map((category): AdminMenuRow => ({
      id: -category.id,
      surface: "BLOG",
      position: "BLOG_NAV",
      parentId: group.id,
      name: category.name,
      type: "menu",
      icon: category.icon ?? null,
      path: `/blog/article/list?cid=${category.id}`,
      component: null,
      componentName: null,
      permissionKey: `blog:category:${category.id}`,
      sort: category.id,
      status: category.status === 1 ? 1 : 0,
      visible: true,
      alwaysShow: false,
      keepAlive: false,
      isBuiltin: true,
      generatedFromCategory: true,
    })),
  ]
}
