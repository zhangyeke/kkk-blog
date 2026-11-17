import type { ReactNode } from "react"

import { requireBlogAccountPathAccess } from "@/lib/blog/permissions"

export default async function SettingDrawerLayout({ children }: { children: ReactNode }) {
  await requireBlogAccountPathAccess("/blog/setting")
  return children
}
