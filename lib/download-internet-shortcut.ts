/** Windows Internet 快捷方式（.url）纯文本格式（CP936/ UTF-8 均可被 explorer 解析常见 URL）。 */

export function sanitizeWindowsFileName(name: string): string {
    const trimmed = name.replace(/[\\/:*?"<>|]/g, "_").trim()
    return trimmed || "shortcut"
}

export type InternetShortcutOptions = {
    /**
     * 写入 `[InternetShortcut]` 的 IconFile。
     * 常用：站点 `https://你的域名/favicon.ico`，或同源任意可由 shell 识别的图标路径（多为本地路径；HTTPS 图标在 Win10/11 上常会在线拉取，依系统/网络而异）。
     */
    iconUrl?: string
}

export function buildInternetShortcutBody(targetUrl: string, options?: InternetShortcutOptions): string {
    const safe = targetUrl.replace(/\r|\n/g, "")
    let body = `[InternetShortcut]\r\nURL=${safe}\r\n`
    if (options?.iconUrl) {
        const icon = options.iconUrl.replace(/\r|\n/g, "")
        body += `IconFile=${icon}\r\nIconIndex=0\r\n`
    }
    return body
}

/**
 * 在浏览器中触发下载 `.url`，用户保存到桌面后双击即用默认浏览器打开目标地址。
 */
export function downloadInternetShortcut(
    label: string,
    targetUrl: string,
    options?: InternetShortcutOptions
): void {
    const body = buildInternetShortcutBody(targetUrl, options)
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = `${sanitizeWindowsFileName(label)}.url`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
}
