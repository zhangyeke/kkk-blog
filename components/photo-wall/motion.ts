/** 动效常量：时长与缓动集中管理，避免各组件各写一套 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_QUAD = [0.4, 0, 1, 1] as const

export const DUR = {
    fast: 0.12,
    base: 0.18,
    med: 0.24,
    slow: 0.42,
} as const

/** 卡片入场：位移 + 淡入 */
export const CARD_ENTER = {
    hidden: {opacity: 0, y: 16},
    visible: {opacity: 1, y: 0},
}

/** reduced-motion 下的降级：只做透明度 */
export const FADE_ONLY = {
    hidden: {opacity: 0},
    visible: {opacity: 1},
}
