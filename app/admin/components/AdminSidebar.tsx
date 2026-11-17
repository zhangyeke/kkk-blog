"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, BookOpen, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Image } from "@/components/k-view/Image"
import { cn } from "@/lib/ui/cn"
import type { AdminNavItem } from "@/lib/admin/menu-tree"
import { roleLabel } from "@/lib/admin/permissions"
import type { AdminBranding } from "@/lib/admin/settings-store"
import { AdminIcon } from "./admin-icons"
import { AdminUserAvatar } from "./AdminUserAvatar"
import { type AdminShellUser, useAdminMobileNav } from "./AdminShell"

export function AdminSidebar({items, user, brand}: { items: AdminNavItem[]; user: AdminShellUser; brand: AdminBranding }) {
    const pathname = usePathname()
    const reduce = useReducedMotion()
    const nav = useAdminMobileNav()
    const collapsed = nav.collapsed

    /** 有子项且当前路径命中子项时，默认展开 */
    const [openKeys, setOpenKeys] = React.useState<string[]>(() =>
        items
            .filter((item) => item.children?.some((child) => pathname === child.href))
            .map((item) => item.key),
    )

    React.useEffect(() => {
        const hit = items.find((item) => item.children?.some((child) => pathname === child.href))
        if (hit) setOpenKeys((prev) => (prev.includes(hit.key) ? prev : [...prev, hit.key]))
    }, [pathname, items])

    const toggle = (key: string) =>
        setOpenKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

    return (
        <div className={cn("flex h-full flex-col py-5 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", collapsed ? "px-2" : "px-3")}>
            <div className={cn("flex items-center gap-2.5 overflow-hidden pb-5 transition-[gap,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", collapsed ? "justify-center gap-0 px-0" : "px-2")}>
                <span className="grid size-9 shrink-0 place-items-center" style={{color: "var(--adm-c1)"}}>
                    {brand.icon ? (
                        <Image
                            src={brand.icon}
                            alt={brand.name}
                            loading="eager"
                            objectFit="contain"
                            className="size-8"
                            fallback={<AdminIcon name="book" className="size-8"/>}
                        />
                    ) : <AdminIcon name="book" className="size-8"/>}
                </span>
                <div className={cn("min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:max-w-[160px]", collapsed && "md:max-w-0 md:-translate-x-1 md:opacity-0")}>
                    <div className="adm-serif truncate text-base md:text-lg" style={{color: "var(--adm-ink)"}}>
                        {brand.name}
                    </div>
                    <div className="text-xs md:text-sm tracking-[0.22em]" style={{color: "var(--adm-ink-3)"}}>
                        {brand.subtitle}
                    </div>
                </div>
            </div>

            <nav aria-label="后台导航" className="flex flex-col gap-0.5">
                {items.map((item) => {
                    const hasChildren = (item.children?.length ?? 0) > 0
                    const childActive = item.children?.some((child) => pathname === child.href) ?? false
                    /*
                     * href 现在来自 DB（菜单行的 path 字段），可能为空串
                     * （后台新建了菜单但还没填路径）。空串会让 startsWith("") 恒为 true，
                     * 那样所有菜单都会高亮，所以这里显式挡掉。
                     */
                    const active = hasChildren
                        ? childActive
                        : item.href === ""
                            ? false
                            : item.href === "/admin"
                                ? pathname === "/admin"
                                : pathname.startsWith(item.href)
                    const expanded = openKeys.includes(item.key)

                    return (
                        <div key={item.key}>
                            <Link
                                href={hasChildren ? (item.children![0]?.href ?? item.href) : item.href}
                                aria-current={active && !hasChildren ? "page" : undefined}
                                aria-expanded={hasChildren ? expanded : undefined}
                                onClick={() => {
                                    // 有子项时：正常跳转到首个子项，同时切换展开态
                                    if (hasChildren) toggle(item.key)
                                }}
                                // 抽屉里按触摸目标给 44px，md 以上回到 40px 的紧凑行高
                                title={collapsed ? item.label : undefined}
                                className={cn("group relative flex h-11 items-center gap-2.5 rounded-lg px-2.5 transition-[background,color,transform,gap,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:translate-x-0.5 hover:bg-[var(--adm-paper-3)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--adm-c1)] motion-reduce:transition-none md:h-[40px]", collapsed && "md:justify-center md:gap-0 md:px-0")}
                                style={{
                                    background: active && !hasChildren ? "var(--adm-paper-3)" : undefined,
                                    color: active ? "var(--adm-ink)" : "var(--adm-ink-2)",
                                }}
                            >
                                {active && !hasChildren && (
                                    <motion.span
                                        layoutId="adm-nav-indicator"
                                        className="absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-full"
                                        style={{background: "var(--adm-c2)"}}
                                        transition={reduce ? {duration: 0} : {type: "spring", stiffness: 420, damping: 34}}
                                    />
                                )}
                                <AdminIcon name={item.icon} className="size-[18px]"/>
                                <span className={cn("overflow-hidden whitespace-nowrap text-base md:text-lg tracking-[0.03em] transition-[max-width,opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:max-w-[180px]", collapsed && "md:max-w-0 md:-translate-x-1 md:opacity-0")}>{item.label}</span>

                                {hasChildren ? (
                                    <motion.span
                                        aria-hidden={collapsed}
                                        animate={{rotate: expanded ? 180 : 0}}
                                        transition={{duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1]}}
                                        className={cn("ml-auto grid shrink-0 place-items-center transition-[opacity,transform] duration-150 motion-reduce:transition-none", collapsed && "md:hidden")}
                                        style={{color: "var(--adm-ink-3)"}}
                                    >
                                        <ChevronDown className="size-4"/>
                                    </motion.span>
                                ) : (
                                    <span
                                        className={cn("ml-auto overflow-hidden whitespace-nowrap text-xs md:text-sm tabular-nums tracking-[0.04em] transition-[max-width,opacity] duration-150 motion-reduce:transition-none md:max-w-8", collapsed && "md:hidden")}
                                        style={{color: active ? "var(--adm-c2)" : "var(--adm-ink-3)"}}
                                    >
                                        {String(item.order).padStart(2, "0")}
                                    </span>
                                )}
                            </Link>

                            {/* 二级菜单：高度动画 0 → auto */}
                            {hasChildren && (
                                <AnimatePresence initial={false}>
                                    {expanded && (
                                        <motion.div
                                            initial={reduce ? {opacity: 0} : {height: 0, opacity: 0}}
                                            animate={reduce ? {opacity: 1} : {height: "auto", opacity: 1}}
                                            exit={reduce ? {opacity: 0} : {height: 0, opacity: 0}}
                                            transition={{duration: reduce ? 0.1 : 0.26, ease: [0.16, 1, 0.3, 1]}}
                                            className="overflow-hidden"
                                        >
                                            <div
                                                className={cn("mt-0.5 flex flex-col gap-0.5 border-l", collapsed ? "ml-0 items-center border-transparent pl-0 md:items-stretch" : "ml-[19px] pl-3")}
                                                style={{borderColor: "var(--adm-line-2)"}}
                                            >
                                                {item.children!.map((child) => {
                                                    const isChildActive = pathname === child.href
                                                    return (
                                                        <Link
                                                            key={child.key}
                                                            href={child.href}
                                                            aria-current={isChildActive ? "page" : undefined}
                                                            title={collapsed ? child.label : undefined}
                                                            className={cn("flex h-8 items-center rounded-md px-2 text-sm md:text-base transition-colors hover:bg-[var(--adm-paper-3)] hover:text-[var(--adm-ink)]", collapsed && "justify-center px-0 md:justify-center")}
                                                            style={{
                                                                color: isChildActive ? "var(--adm-ink)" : "var(--adm-ink-3)",
                                                                background: isChildActive ? "var(--adm-paper-3)" : undefined,
                                                            }}
                                                        >
                                                            <>
                                                                <span className={cn(collapsed && "md:hidden")}>{child.label}</span>
                                                                <span className={cn("hidden size-6 place-items-center rounded-md bg-[var(--adm-paper-3)] text-xs md:text-sm", collapsed && "md:grid")} aria-hidden="true">
                                                                    {child.label.slice(0, 1)}
                                                                </span>
                                                            </>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    )
                })}
            </nav>

            <div className="mt-auto border-t pt-3" style={{borderColor: "var(--adm-line-2)"}}>
                <div className={cn("flex min-w-0 items-center gap-2.5 transition-[gap,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none", collapsed ? "justify-center gap-0 px-0 md:px-0" : "px-2")}>
                    <AdminUserAvatar
                        name={user.name}
                        avatar={user.avatar}
                        className="transition-[width,height,opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        sizeClassName={cn("size-8", collapsed && "md:size-0 md:scale-75 md:opacity-0")}
                    />
                    <div className={cn("min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:max-w-[180px]", collapsed && "md:w-0 md:max-w-0 md:flex-none md:-translate-x-1 md:opacity-0")}>
                        <div className="truncate text-sm md:text-base" style={{color: "var(--adm-ink)"}}>
                            {user.name}
                        </div>
                        <div className="text-xs md:text-sm tracking-[0.06em]" style={{color: "var(--adm-ink-3)"}}>
                            {roleLabel(user.roles, user.roleNames)}
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={() => nav.setCollapsed(!collapsed)}
                        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
                        title={collapsed ? "展开侧边栏" : "收起侧边栏"}
                        variant="ghost"
                        size="icon"
                        className="hidden size-7 shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--adm-ink)] motion-reduce:transition-none md:inline-flex"
                    >
                        <AnimatePresence initial={false} mode="wait">
                            <motion.span
                                key={collapsed ? "expanded" : "collapsed"}
                                initial={reduce ? {opacity: 1} : {opacity: 0, rotate: -18, scale: 0.88}}
                                animate={{opacity: 1, rotate: 0, scale: 1}}
                                exit={reduce ? {opacity: 1} : {opacity: 0, rotate: 18, scale: 0.88}}
                                transition={{duration: reduce ? 0 : 0.16, ease: [0.22, 1, 0.36, 1]}}
                                className="grid place-items-center"
                            >
                                {collapsed ? <PanelLeftOpen className="size-4"/> : <PanelLeftClose className="size-4"/>}
                            </motion.span>
                        </AnimatePresence>
                    </Button>
                </div>

                <Link
                    href="/blog"
                    className={cn(
                        "mt-2 flex h-9 min-w-0 items-center gap-1.5 overflow-hidden rounded-lg px-2.5 text-sm md:text-base",
                        "transition-[background-color,gap,padding] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[var(--adm-paper-3)] motion-reduce:transition-none",
                        collapsed && "md:justify-center md:gap-0 md:px-0",
                    )}
                    style={{color: "var(--adm-ink-3)"}}
                    title={collapsed ? "回到博客" : undefined}
                >
                    <BookOpen className="size-4 shrink-0"/>
                    <span className={cn("max-w-24 truncate whitespace-nowrap transition-[max-width,opacity] duration-150 motion-reduce:transition-none", collapsed && "md:max-w-0 md:opacity-0")}>回到博客</span>
                    <ArrowUpRight className={cn("ml-auto size-4 shrink-0 transition-[opacity,transform] duration-150 motion-reduce:transition-none", collapsed && "md:hidden")}/>
                </Link>
            </div>
        </div>
    )
}
