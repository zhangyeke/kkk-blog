import type {CSSProperties, ReactNode} from "react"

import {cn} from "@/lib/ui/cn"

export type TagTone = "neutral" | "muted" | "primary" | "success" | "warning" | "danger"
export type TagAppearance = "outline" | "soft" | "plain"
export type TagSize = "sm" | "md"
export type TagShape = "pill" | "rounded"

export type TagProps = {
    children: ReactNode
    tone?: TagTone
    appearance?: TagAppearance
    size?: TagSize
    shape?: TagShape
    icon?: ReactNode
    className?: string
    style?: CSSProperties
    title?: string
}

const TONE_COLOR: Record<TagTone, string> = {
    neutral: "var(--adm-ink-2)",
    muted: "var(--adm-ink-3)",
    primary: "var(--adm-c1)",
    success: "var(--adm-c3)",
    warning: "var(--adm-c2)",
    danger: "var(--adm-c2)",
}

const TONE_STYLE: Record<TagTone, CSSProperties> = {
    neutral: {color: TONE_COLOR.neutral, borderColor: "var(--adm-line)", background: "transparent"},
    muted: {color: TONE_COLOR.muted, borderColor: "var(--adm-line)", background: "var(--adm-paper-3)"},
    primary: {color: TONE_COLOR.primary, borderColor: "color-mix(in oklab, var(--adm-c1) 40%, var(--adm-line))", background: "color-mix(in oklab, var(--adm-c1) 10%, transparent)"},
    success: {color: TONE_COLOR.success, borderColor: "color-mix(in oklab, var(--adm-c3) 45%, var(--adm-line))", background: "color-mix(in oklab, var(--adm-c3) 11%, transparent)"},
    warning: {color: TONE_COLOR.warning, borderColor: "color-mix(in oklab, var(--adm-c2) 45%, var(--adm-line))", background: "color-mix(in oklab, var(--adm-c2) 11%, transparent)"},
    danger: {color: TONE_COLOR.danger, borderColor: "color-mix(in oklab, var(--adm-c2) 45%, var(--adm-line))", background: "color-mix(in oklab, var(--adm-c2) 10%, transparent)"},
}

/** 后台统一标签，颜色取自 admin theme token，允许调用方用 style 微调。 */
export function Tag({
    children,
    tone = "neutral",
    appearance = "outline",
    size = "md",
    shape = "pill",
    icon,
    className,
    style,
    title,
}: TagProps) {
    const toneStyle = TONE_STYLE[tone]
    const resolvedStyle = appearance === "plain"
        ? {color: toneStyle.color, borderColor: "transparent", background: "transparent"}
        : appearance === "outline"
            ? {color: toneStyle.color, borderColor: toneStyle.borderColor, background: "transparent"}
            : toneStyle

    return (
        <span
            title={title}
            className={cn(
                "inline-flex w-fit max-w-full shrink-0 items-center gap-1 whitespace-nowrap",
                appearance === "plain"
                    ? size === "sm" ? "text-xs md:text-sm" : "text-sm"
                    : cn("border", size === "sm" ? "px-2 py-0.5 text-xs md:text-sm" : "px-2.5 py-1 text-sm"),
                appearance !== "plain" && (shape === "pill" ? "rounded-full" : "rounded"),
                className,
            )}
            style={{...resolvedStyle, ...style}}
        >
            {icon && <span className="inline-flex shrink-0 items-center" aria-hidden="true">{icon}</span>}
            {children}
        </span>
    )
}
