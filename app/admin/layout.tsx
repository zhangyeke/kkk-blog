import type { Metadata } from "next"
import { redirect } from "next/navigation"

import "@/styles/admin-theme.css"

import { getAdminUser } from "@/lib/admin-guard"
import { getAllowedKeys } from "@/lib/permission-store"
import { AdminShell } from "./components/AdminShell"

export const metadata: Metadata = {
    title: {
        template: "%s | 后台",
        default: "后台管理",
    },
    robots: {index: false, follow: false},
}

/**
 * 后台外壳。
 *
 * 三个插槽来自并行路由：
 * - @sidebar：侧栏导航（按角色过滤后的菜单）
 * - @topbar：面包屑 + 主题切换 + 明暗
 * - children：页面内容
 *
 * 这样切页时侧栏与顶栏不会重挂载，只有 children 变——比每个页面重复写一遍导航省得多，
 * 也不会出现「切页时菜单闪一下」。
 */
export default async function AdminLayout({
    children,
    sidebar,
    topbar,
}: {
    children: React.ReactNode
    /** 并行路由插槽 */
    sidebar: React.ReactNode
    topbar: React.ReactNode
}) {
    const user = await getAdminUser()
    if (!user) redirect("/login")

    /*
     * 权限 key 全集在服务端算好（走 DB 矩阵，与 requireAction 同源），
     * 客户端只拿结果，不拿矩阵 —— 客户端不需要知道别的角色有什么权限。
     *
     * 传 key 全集（而不是动作白名单）是为了容纳「后台新建的 permissionKey」：
     * 菜单树驱动的 RBAC 里 key 是数据，AdminAction 联合类型覆盖不全。
     */
    const keys = await getAllowedKeys(user.roles)

    return (
        <AdminShell user={user} keys={keys} sidebar={sidebar} topbar={topbar}>
            {children}
        </AdminShell>
    )
}
