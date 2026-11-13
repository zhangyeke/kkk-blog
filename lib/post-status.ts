/** 文章状态：0 下架 / 1 正常 / 2 草稿 */
export function postStatusLabel(status: number | null | undefined): {
    label: string
    tone: "live" | "draft" | "off"
} {
    if (status === 1) return {label: "已发布", tone: "live"}
    if (status === 2) return {label: "草稿", tone: "draft"}
    return {label: "已下架", tone: "off"}
}
