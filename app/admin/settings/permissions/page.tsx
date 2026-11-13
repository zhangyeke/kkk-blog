import type { Metadata } from "next"

import { requirePageAccess } from "@/lib/admin-guard"
import { getAllowedKeys } from "@/lib/permission-store"
import { getMenuListView, type MenuListView } from "@/service/menu"
import { MenuManager } from "./MenuManager"

export const metadata: Metadata = {title: "菜单管理"}
export const dynamic = "force-dynamic"

/** 读失败时的空壳，保证客户端组件永远拿到合法 props */
const EMPTY_VIEW: MenuListView = {rows: [], grantCounts: {}, roles: []}

export default async function Page() {
    /*
     * 守卫用 page:menus 而不是 page:settings：
     * page:settings 现在只代表「站点信息」这一页，菜单管理是独立页面。
     */
    const user = await requirePageAccess("menus")

    const [result, allowed] = await Promise.all([getMenuListView(), getAllowedKeys(user.roles)])
    const data = result.code === 200 ? result.data : EMPTY_VIEW

    return (
        <div className="flex h-full min-h-0 flex-col">
            <MenuManager
                rows={data.rows}
                grantCounts={data.grantCounts}
                roles={data.roles}
                allowed={allowed}
            />
        </div>
    )
}
