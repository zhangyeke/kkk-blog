import { redirect } from "next/navigation"

import { getAdminUser } from "@/lib/admin/guard"
import { getNavForUser } from "@/lib/admin/menu-store"
import { AdminTopbar } from "../components/AdminTopbar"

/**
 * 并行路由插槽：顶栏。
 *
 * 面包屑需要和侧栏**同一份**导航数据，否则会出现「侧栏叫菜单管理、面包屑叫菜单权限管理」
 * 这种改名不同步的问题。所以这里也走 getNavForUser（同一个 React.cache 键，
 * 同请求内不会重复查库）。
 */
export default async function TopbarSlot() {
    const user = await getAdminUser()
    if (!user) redirect("/login")

    const nav = await getNavForUser(user.roles)

    return <AdminTopbar user={user} nav={nav} />
}
