import MobileNavigation from "./MobileNavigation"
import LeftNavigationMenu from "./LeftNavigationMenu";
import RightNavigation from "./RightNavigation";
import Logo from "./Logo";
import Header from "./Header";
import {auth} from "@/lib/auth";
import { buildMenuTree, filterNav } from "@/lib/admin/menu-tree"
import { getBlogMenuRows } from "@/lib/blog/menu-store"
import { getBlogAccess } from "@/lib/blog/permissions"
import { getBlogAccountMenu } from "@/lib/blog/account-menu"



export default async function HeaderContainer() {
    const [session, menuRows, access] = await Promise.all([auth(), getBlogMenuRows(), getBlogAccess()])
    const allowedKeys = [...access.keys]
    const accountMenu = getBlogAccountMenu(menuRows, access.keys)
    const mainMenuRows = menuRows.filter((row) => row.position === "BLOG_NAV")
    const nav = filterNav(buildMenuTree(mainMenuRows), { current: allowedKeys }, "current")
    const menuList = nav.map((item) => ({
        name: item.label,
        href: item.href || undefined,
        children: item.children?.map((child) => ({name: child.label, href: child.href})),
    }))

    // 后台入口使用后台权限单独判断，不跟随博客菜单授权。
    if (allowedKeys.includes("page:dashboard")) {
        const home = menuList.find((item) => item.name === "首页")
        const adminLink = {name: "后台管理", href: "/admin"}
        if (home) home.children = [...(home.children ?? []), adminLink]
        else menuList.unshift({name: "首页", children: [adminLink], href: undefined})
    }
    return (
        <Header>
            <div className={'flex flex-items'}>
                <Logo/>
                <LeftNavigationMenu className={'md:ml-4 md:flex hidden'} menuList={menuList} />
            </div>
            <RightNavigation className={'md:flex hidden'} session={session} accountMenuItems={accountMenu.items}/>
            <MobileNavigation className={'md:hidden'} menuList={menuList} session={session} accountMenuItems={accountMenu.items}/>
        </Header>
    )
}

