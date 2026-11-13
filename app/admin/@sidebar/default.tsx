import { redirect } from "next/navigation"

import { getAdminUser } from "@/lib/admin-guard"
import { getNavForUser } from "@/lib/admin-menu-store"
import { AdminSidebar } from "../components/AdminSidebar"

/**
 * 并行路由插槽：侧栏。
 * 用 default.tsx 而不是 page.tsx——这个插槽没有自己的路由段，
 * 任何 /admin/* 路径都应该渲染它。
 *
 * 导航项来自 AdminMenu 表（getNavForUser：菜单树 + 权限矩阵，请求级缓存、无 TTL），
 * 所以后台改完菜单（改名 / 改 sort / 改 visible）或改完权限，刷新页面侧栏立刻跟着变。
 */
export default async function SidebarSlot() {
    const user = await getAdminUser()
    if (!user) redirect("/login")

    const nav = await getNavForUser(user.roles)

    return <AdminSidebar items={nav} user={user} />
}
