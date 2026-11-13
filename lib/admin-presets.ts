/**
 * 后台主题预设的元数据。
 * 只放 id / 名称 / 三色预览点；真正的色值在 styles/admin-theme.css 里。
 * 新增预设：这里加一条 + CSS 加两块（明/暗）。
 */

export type AdminPresetId =
    | "paper"
    | "neon"
    | "moss"
    | "dusk"
    | "mint"
    | "ink"
    | "sakura"
    | "salt"
    | "brick"

export type AdminPreset = {
    id: AdminPresetId
    label: string
    /** 预览用的三个色点：结构色 / 强调色 / 纸色 */
    dots: [string, string, string]
}

export const ADMIN_PRESETS: AdminPreset[] = [
    {id: "paper", label: "和纸文库", dots: ["#3d4a6d", "#dd8397", "#f7f3ea"]},
    {id: "neon", label: "夜行霓虹", dots: ["#2563eb", "#ff3d8b", "#f3f5f9"]},
    {id: "moss", label: "苔绿", dots: ["#2f6b4f", "#c07a3e", "#eef3ec"]},
    {id: "dusk", label: "黄昏", dots: ["#b4531f", "#2f7d7a", "#f6ede2"]},
    {id: "mint", label: "薄荷", dots: ["#0f766e", "#f97362", "#eef7f4"]},
    {id: "ink", label: "墨白", dots: ["#18181b", "#dc2626", "#f5f5f4"]},
    {id: "sakura", label: "樱粉", dots: ["#9d2f52", "#db2777", "#fdf2f4"]},
    {id: "salt", label: "海盐", dots: ["#1d4ed8", "#0ea5e9", "#f1f5f8"]},
    {id: "brick", label: "砖红", dots: ["#7c2d12", "#b91c1c", "#f6f1ec"]},
]

export const DEFAULT_PRESET: AdminPresetId = "paper"
export const PRESET_STORAGE_KEY = "admin-preset"

export function isPresetId(value: string | null | undefined): value is AdminPresetId {
    return !!value && ADMIN_PRESETS.some((p) => p.id === value)
}
