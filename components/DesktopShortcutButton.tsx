/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-05-01 12:32:30
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 13:23:13
 * @FilePath: \blog\app\blog\components\Layout\Header\DesktopShortcutButton.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"

import React from "react"

import {
    downloadInternetShortcut,
    sanitizeWindowsFileName,
} from "@/lib/download-internet-shortcut"
import { cn } from "@/lib/utils"

function labelForShortcut(): string {
    if (typeof document === "undefined") return "博客"
    const raw = document.title.split(/\s*[|\-–—]\s*/)[0]?.trim()
    const s = sanitizeWindowsFileName(raw || "")
    return s || "博客"
}

export type DesktopShortcutButtonProps = ContainerProps &
    BaseComponentProps & {
        /** 快捷方式图标（IconFile）。绝对 URL；若以 `/` 开头则相对于当前站点。不设则生成的 .url 不含图标字段。 */
        shortcutIconUrl?: string
    }

function resolveShortcutIconUrl(icon: string): string {
    if (icon.startsWith("http://") || icon.startsWith("https://")) return icon
    return new URL(icon.startsWith("/") ? icon : `/${icon}`, window.location.origin).href
}

/** 下载当前页的 Windows `.url`，保存到桌面即可作为快捷方式。 */
export function DesktopShortcutButton({
    children,
    className,
    style,
    shortcutIconUrl,
}: DesktopShortcutButtonProps) {
    const handleClick = React.useCallback(() => {
        downloadInternetShortcut(
            labelForShortcut(),
            window.location.origin,
            shortcutIconUrl
                ? { iconUrl: resolveShortcutIconUrl(shortcutIconUrl) }
                : undefined
        )
    }, [shortcutIconUrl])

    return (
        <div
            className={cn(className, 'cursor-pointer')}
            style={style}
            aria-label="下载桌面快捷方式"
            onClick={handleClick}>
            {children}
        </div>

    )
}
