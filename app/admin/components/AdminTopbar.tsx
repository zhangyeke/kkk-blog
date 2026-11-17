"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, Moon, Sun } from "lucide-react"

import { type AdminNavItem, breadcrumbFor } from "@/lib/admin/menu-tree"
import { AdminUserAvatar } from "./AdminUserAvatar"
import { type AdminShellUser, useAdminMobileNav } from "./AdminShell"
import { ThemeSwitcher } from "./ThemeSwitcher"

/**
 * 顶栏：面包屑 + 主题切换 + 用户头像。
 *
 * 面包屑不再查代码里写死的 ADMIN_NAV，而是查侧栏传下来的 nav（同一份菜单树数据）：
 * `breadcrumbFor` 的匹配优先级是「二级精确 → 一级精确 → 最长 href 前缀」，
 * 所以 /admin/posts/categories 会拿到「文章管理 / 文章分类」，
 * 详情页（/admin/posts/123）会退化成「文章管理」。
 */
export function AdminTopbar({ user, nav }: { user: AdminShellUser; nav: AdminNavItem[] }) {
    const pathname = usePathname()
    const {resolvedTheme, setTheme} = useTheme()
    const mobileNav = useAdminMobileNav()
    const isForbidden = pathname.startsWith("/admin/forbidden")
    const crumb = breadcrumbFor(pathname, nav)
    // 403 页不在菜单树里，面包屑单独给个名字
    const rootLabel = isForbidden ? "无权访问" : (crumb.root?.label ?? "概览")
    /*
     * 第三级只在「子项与父项不是同一个地址」时显示：
     * 例如 /admin/posts 的 root 是「文章管理」（href 取首个子项 /admin/posts）、
     * child 是「文章」（href 也是 /admin/posts），两级重复，没必要显示。
     */
    const childLabel =
        !isForbidden && crumb.child && crumb.child.href !== crumb.root?.href ? crumb.child.label : null

    return (
        <header
            className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur-md sm:h-[60px] sm:gap-3 sm:px-6"
            style={{
                borderColor: "var(--adm-line)",
                background: "color-mix(in oklab, var(--adm-paper) 82%, transparent)",
            }}
        >
            {/* 窄屏才有：打开侧栏抽屉 */}
            <button
                type="button"
                aria-label="打开菜单"
                aria-expanded={mobileNav.open}
                onClick={() => mobileNav.setOpen(true)}
                className="-ml-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors hover:bg-[var(--adm-paper-3)] md:hidden"
                style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
            >
                <Menu className="size-4"/>
            </button>

            <nav aria-label="面包屑" className="flex min-w-0 items-center gap-2 text-sm md:text-base">
                <span className="hidden sm:inline" style={{color: "var(--adm-ink-3)"}}>后台</span>
                <span className="hidden sm:inline" style={{color: "var(--adm-ink-3)", opacity: 0.5 }}>/</span>
                <span className="truncate" style={{color: "var(--adm-ink)"}}>
                    {rootLabel}
                </span>
                {childLabel && (
                    <>
                        <span style={{color: "var(--adm-ink-3)", opacity: 0.5}}>/</span>
                        <span className="truncate" style={{color: "var(--adm-ink-2)"}}>{childLabel}</span>
                    </>
                )}
            </nav>

            <div className="flex-1"/>

            <ThemeSwitcher/>

            <button
                type="button"
                aria-label="切换明暗"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="grid size-9 cursor-pointer place-items-center rounded-lg border transition-colors hover:bg-[var(--adm-paper-3)]"
                style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
            >
                {resolvedTheme === "dark" ? <Sun className="size-4"/> : <Moon className="size-4"/>}
            </button>

            <AdminUserAvatar
                name={user.name}
                avatar={user.avatar}
                sizeClassName="size-9"
                className="text-sm md:text-base"
                title={`${user.name} · ${user.roles}`}
            />
        </header>
    )
}
