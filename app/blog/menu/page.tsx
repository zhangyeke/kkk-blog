
import type { Metadata } from "next"
import { requireBlogPathAccess } from "@/lib/blog/permissions"

export const metadata: Metadata = {
    title: "菜单",
    robots: {index: false, follow: false},
}

export default async function Page() {
    await requireBlogPathAccess("/blog/menu")

    return (
        <div>
            一个菜单
        </div>
    )
}
