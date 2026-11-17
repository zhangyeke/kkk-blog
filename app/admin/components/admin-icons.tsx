"use client"

import React from "react"

import type { AdminIconName } from "@/assets/enumerate/global"
import { cn } from "@/lib/ui/cn"

export { ADMIN_ICON_NAMES } from "@/assets/enumerate/global"

type AdminIconKey = AdminIconName | "fallback"

/**
 * 后台图标字典（侧栏 + 菜单管理共用）。
 *
 * ── 为什么单独抽成一个模块 ──
 *
 * 图标原本写死在 AdminSidebar 里，只有侧栏一个消费者。菜单管理页需要
 * 「下拉选择图标 + 预览」，两边必须**同一份**字典：否则后台给菜单选了
 * 一个侧栏认不出的名字，侧栏只能画兜底圆点，用户会以为没保存成功。
 *
 * 这里保持 **24×24 viewBox、纯 stroke、无填充** 的同一套线性语言，
 * 新增图标只要按同样风格加一条 path 即可。
 */

/** 图标名 → path 集合。`fallback` 不参与选择器，只在名字认不出来时兜底 */
export const ADMIN_ICONS: Record<AdminIconKey, React.ReactNode> = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="9" rx="1.5"/>
            <rect x="14" y="3" width="7" height="5" rx="1.5"/>
            <rect x="14" y="12" width="7" height="9" rx="1.5"/>
            <rect x="3" y="16" width="7" height="5" rx="1.5"/>
        </>
    ),
    posts: (
        <>
            <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
            <path d="M14 4v5h5"/>
        </>
    ),
    bookmarks: (
        <>
            <path d="M6 3h9l4 4v14H6z"/>
            <path d="M9 12h7M9 16h5"/>
        </>
    ),
    footprints: (
        <>
            <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/>
            <circle cx="12" cy="10" r="2.6"/>
        </>
    ),
    users: (
        <>
            <circle cx="9" cy="8" r="3.2"/>
            <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
            <circle cx="17" cy="9" r="2.4"/>
            <path d="M16 15.2c2.6.2 4.5 2 4.5 4.8"/>
        </>
    ),
    settings: (
        <>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"/>
        </>
    ),
    book: (
        <>
            <path d="M4.5 5.2A2.2 2.2 0 0 1 6.7 3h4.1c1.2 0 2.3.5 3.2 1.4C14.9 3.5 16 3 17.2 3h.1a2.2 2.2 0 0 1 2.2 2.2v13.1a1.7 1.7 0 0 1-1.7 1.7h-.7c-1.3 0-2.4.5-3.1 1.4-.8-.9-1.9-1.4-3.2-1.4H6.2a1.7 1.7 0 0 1-1.7-1.7z"/>
            <path d="M14 4.4v16M5 18.5c.4-.3.8-.5 1.3-.5h4.5M19 18.5c-.4-.3-.8-.5-1.3-.5H14"/>
        </>
    ),
    /** 以下为「后台新建菜单」时可选的一组通用图标 */
    folder: (
        <>
            <path d="M3 7.2A2.2 2.2 0 0 1 5.2 5h3.6l2 2h8A2.2 2.2 0 0 1 21 9.2v8.6A2.2 2.2 0 0 1 18.8 20H5.2A2.2 2.2 0 0 1 3 17.8z"/>
        </>
    ),
    file: (
        <>
            <path d="M6 3.5h7.5L18 8v12.5H6z"/>
            <path d="M13.5 3.5V8H18"/>
            <path d="M9 12h6M9 15.5h4"/>
        </>
    ),
    tag: (
        <>
            <path d="M4 12.4V5.2A1.2 1.2 0 0 1 5.2 4h7.2l7.4 7.4-7.4 7.4z"/>
            <circle cx="8.6" cy="8.6" r="1.3"/>
        </>
    ),
    comment: (
        <>
            <path d="M4 5.5h16v9.6H9.4L4 19.4z"/>
            <path d="M8 9.2h8M8 12.2h5"/>
        </>
    ),
    image: (
        <>
            <rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2"/>
            <circle cx="8.8" cy="9.6" r="1.5"/>
            <path d="M4 17.4l4.6-4.4 3.6 3.4 2.8-2.6 5 4.2"/>
        </>
    ),
    link: (
        <>
            <path d="M10.2 13.8a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7L11.6 6.7"/>
            <path d="M13.8 10.2a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 1 0 5.7 5.7l1.2-1.2"/>
        </>
    ),
    shield: (
        <>
            <path d="M12 3.2l7 3v6c0 4-3 7.1-7 8.6-4-1.5-7-4.6-7-8.6v-6z"/>
            <path d="M9 12l2.2 2.2L15.4 10"/>
        </>
    ),
    chart: (
        <>
            <path d="M4 20V10.4M9.4 20V5M14.8 20v-6.6M20.2 20V8"/>
            <path d="M3 20h18"/>
        </>
    ),
    star: (
        <>
            <path d="M12 4.2l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z"/>
        </>
    ),
    /** 兜底图标：认不出来时画个圆点，不要渲染成空白 */
    fallback: (
        <>
            <circle cx="12" cy="12" r="3.2"/>
            <circle cx="12" cy="12" r="7.6" strokeDasharray="2 3"/>
        </>
    ),
}

/** 后台图标。name 认不出来（或为空）时画兜底图标，不返回 null */
export function AdminIcon({ name, className }: { name?: string | null; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={cn("shrink-0", className)}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
        >
            {ADMIN_ICONS[name ?? ""] ?? ADMIN_ICONS.fallback}
        </svg>
    )
}
