import {redirect} from "next/navigation"

import type { Metadata } from "next"
import { requireBlogAccountPathAccess } from "@/lib/blog/permissions"

export const metadata: Metadata = {
  title: "设置",
  robots: { index: false, follow: false },
}

export default async function Page() {
    await requireBlogAccountPathAccess("/blog/setting")
    redirect('/blog')
}
