import type { AdminMenuRow } from "@/lib/admin/menu-seed"
import { buildMenuTree } from "@/lib/admin/menu-tree"

export type BlogAccountMenuItem = {
  key: string
  label: string
  href: string
  icon: string | null
}

export type BlogAccountMenu = {
  /** Active account links granted to the current role set. */
  items: BlogAccountMenuItem[]
}

/** Pick role-authorized links assigned to the personal-center position. */
export function getBlogAccountMenu(
  rows: readonly AdminMenuRow[],
  allowedKeys: ReadonlySet<string>,
): BlogAccountMenu {
  const tree = buildMenuTree(rows.filter((row) => row.surface === "BLOG" && row.position === "USER_BRIEF"))
  const items: BlogAccountMenuItem[] = []

  const visit = (nodes: typeof tree) => {
    for (const node of nodes) {
      const { row } = node
      if (row.status !== 1 || !row.visible) continue
      if (row.type === "dir") {
        visit(node.children)
        continue
      }
      if (row.type !== "menu" || !row.path || !row.permissionKey || !allowedKeys.has(row.permissionKey)) continue
      items.push({key: row.permissionKey, label: row.name, href: row.path, icon: row.icon})
    }
  }

  visit(tree)
  return {items}
}
