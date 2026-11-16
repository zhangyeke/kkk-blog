import type React from "react"

/**
 * 照片墙的视觉 token。
 *
 * 全部挂在页面根节点（`style={...}`），沿用已有的 `--pw-primary` 注入方式：
 * `--primary` 在 CSS 里初始为 transparent、靠客户端 effect 注入，
 * 所以这里统一从 `--pw-primary` 派生，并带暖沙金兜底。
 *
 * 阴影用中性黑（oklch 0 0 0 / α）而非主题色——黑白是物理量不是品牌色；
 * 暗色模式下黑色阴影本就不明显，靠 `--pw-rim` 的顶部内高光提供浮起感。
 */
export const PW_TOKENS = {
    "--pw-ink": "var(--foreground)",
    "--pw-ink-2": "color-mix(in oklab, var(--foreground) 68%, var(--background))",
    "--pw-ink-3": "color-mix(in oklab, var(--foreground) 44%, var(--background))",
    "--pw-hair": "color-mix(in oklab, var(--foreground) 10%, transparent)",
    "--pw-paper": "color-mix(in oklab, var(--pw-primary, #e6c99f) 6%, var(--background))",
    "--pw-shadow-1": "0 1px 2px oklch(0 0 0 / .04), 0 6px 18px -10px oklch(0 0 0 / .10)",
    "--pw-shadow-2": "0 2px 4px oklch(0 0 0 / .05), 0 14px 34px -14px oklch(0 0 0 / .16)",
    "--pw-shadow-3": "0 4px 8px oklch(0 0 0 / .06), 0 28px 56px -20px oklch(0 0 0 / .24)",
    "--pw-rim": "inset 0 1px 0 color-mix(in oklab, var(--foreground) 8%, transparent)",
} as const

/**
 * 颗粒噪点：160×160 的 feTurbulence tile，约 330 字节，gzip 后 < 200B。
 * 只铺地图卡（`opacity .05`），**不做全屏层**——全屏噪点会关闭子像素抗锯齿，
 * 11–12px 中文会发虚，且会与全局 WebGL 流体抢合成带宽。
 */
export const PW_GRAIN =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E" +
    "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E" +
    "%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")"

/** 页面根节点样式：主题色 + 视觉 token 一起注入 */
export function photoWallStyle(primary: string): React.CSSProperties {
    return {
        ...PW_TOKENS,
        "--pw-primary": primary,
    } as React.CSSProperties
}
