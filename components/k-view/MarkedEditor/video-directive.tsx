"use client"

import React from "react"
import { PlayCircle, Trash2 } from "lucide-react"
import type { DirectiveDescriptor, DirectiveEditorProps } from "@mdxeditor/editor"

import { cn } from "@/lib/utils"

/** 解析后的视频来源：`file` 用 <video>，`iframe` 是站外播放器，`link` 表示只能跳转观看 */
export type VideoSource = { kind: "file" | "iframe" | "link"; src: string }

const VIDEO_FILE_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i
/** 站外无法嵌入的平台：页面带 X-Frame-Options / CSP frame-ancestors，只认自家域名 */
const LINK_ONLY_HOSTS = ["douyin.com", "iesdouyin.com"]
/** 从任意文本里抓第一个 http(s) 链接，兼容各平台「复制链接」带标题的分享文案 */
const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"'“”‘’【】（）()，。；、]+/i
/** B 站 / 油管「嵌入代码」里的 iframe、video 等标签 */
const EMBED_TAG_RE = /<(?:iframe|video|embed|source)\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/i

/** 把 `//player.bilibili.com/...` 这类协议相对地址补成 https，并只放行 http(s) */
function normalizeUrl(raw: string): string | null {
    const value = raw.trim()
    if (!value) return null
    const candidate = value.startsWith("//") ? `https:${value}` : value
    try {
        const url = new URL(candidate)
        if (url.protocol !== "http:" && url.protocol !== "https:") return null
        return url.href
    } catch {
        return null
    }
}

/** 输入是否为一段 HTML 嵌入代码（而不是纯文本分享文案） */
export function isEmbedCode(input: string): boolean {
    return EMBED_TAG_RE.test(input)
}

/**
 * 抽出可用的链接，按优先级：
 * 1. 嵌入代码里的 `src`（B 站 / 油管后台「复制嵌入代码」）；
 * 2. 文本里的第一个 http(s) 链接（各平台带标题的分享文案）；
 * 3. 整段就是协议相对地址 `//host/path`。
 */
export function extractVideoUrl(input: string): string | null {
    const embedSrc = input.match(EMBED_TAG_RE)?.[1]
    if (embedSrc) {
        const normalized = normalizeUrl(embedSrc)
        if (normalized) return normalized
    }

    const match = input.match(URL_IN_TEXT_RE)
    if (match) return normalizeUrl(match[0])

    if (input.trim().startsWith("//")) return normalizeUrl(input)

    return null
}

/**
 * 把用户粘贴的地址归一化成可嵌入的来源。
 * 只接受 http(s)：`javascript:` / `data:` 之类一律拒绝。
 */
export function resolveVideoSource(input: string): VideoSource | null {
    const href = extractVideoUrl(input)
    if (!href) return null

    const url = new URL(href)
    const host = url.hostname.replace(/^www\./, "").toLowerCase()

    // YouTube：watch?v= / youtu.be/ / shorts/ / embed/
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
        const id =
            host === "youtu.be"
                ? url.pathname.slice(1)
                : (url.searchParams.get("v") ??
                    url.pathname.match(/\/(?:shorts|embed)\/([\w-]+)/)?.[1] ??
                    "")
        return id ? { kind: "iframe", src: `https://www.youtube.com/embed/${encodeURIComponent(id)}` } : null
    }

    // Bilibili：/video/BVxxxx 或 /video/av123
    if (host === "bilibili.com" || host === "m.bilibili.com") {
        const bvid = url.pathname.match(/\/video\/(BV[\w]+)/i)?.[1]
        if (bvid) return { kind: "iframe", src: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0` }
        const aid = url.pathname.match(/\/video\/av(\d+)/i)?.[1]
        if (aid) return { kind: "iframe", src: `https://player.bilibili.com/player.html?aid=${aid}&autoplay=0` }
        return null
    }

    if (VIDEO_FILE_RE.test(url.pathname)) return { kind: "file", src: url.href }

    // 抖音（含 v.douyin.com 短链）：官方播放器需要签名接口拿到的 vid，站外一律无法嵌入，
    // 而且分享页显式禁止被 iframe，这里降级成跳转卡片。
    if (LINK_ONLY_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) {
        return { kind: "link", src: url.href }
    }

    // 其余地址按可嵌入页面处理（自建播放页等）
    return { kind: "iframe", src: url.href }
}

/** 无法嵌入的平台：渲染成可点击的跳转卡片，避免留下一个黑框 */
function VideoLinkCard({ href, className }: { href: string; className?: string }) {
    const host = React.useMemo(() => {
        try {
            return new URL(href).hostname.replace(/^www\./, "")
        } catch {
            return href
        }
    }, [href])
    const label = host.includes("douyin") ? "在抖音观看" : "打开链接观看"

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/10 text-white transition-[filter] hover:brightness-110",
                "bg-[linear-gradient(135deg,#18181b_0%,#2f2f35_55%,#18181b_100%)]",
                className,
            )}
        >
            <PlayCircle className="size-10 opacity-90 transition-transform group-hover:scale-110"/>
            <span className="text-sm font-medium">{label}</span>
            <span className="text-xs text-white/55">{host}</span>
        </a>
    )
}

/** 编辑器内与文章页共用的视频渲染 */
export function VideoEmbed({ src, className }: { src: string; className?: string }) {
    const source = React.useMemo(() => resolveVideoSource(src), [src])

    if (!source) {
        return (
            <div className={cn("rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground", className)}>
                无法识别的视频地址：{src || "（空）"}
            </div>
        )
    }

    if (source.kind === "link") return <VideoLinkCard href={source.src} className={className}/>

    return (
        <div className={cn("relative aspect-video w-full overflow-hidden rounded-lg bg-black", className)}>
            {source.kind === "file" ? (
                <video className="size-full" src={source.src} controls playsInline preload="metadata"/>
            ) : (
                <iframe
                    className="size-full"
                    src={source.src}
                    title="嵌入视频"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                />
            )}
        </div>
    )
}

function VideoDirectiveEditor({ mdastNode, lexicalNode, parentEditor }: DirectiveEditorProps) {
    const src = String(mdastNode.attributes?.src ?? "")

    return (
        <div className="group relative my-2" contentEditable={false}>
            <VideoEmbed src={src}/>
            <button
                type="button"
                aria-label="删除视频"
                title="删除视频"
                onClick={() => parentEditor.update(() => lexicalNode.remove())}
                className="absolute right-2 top-2 flex size-7 cursor-pointer items-center justify-center rounded-md bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 focus-visible:opacity-100 group-hover:opacity-100"
            >
                <Trash2 className="size-4"/>
            </button>
        </div>
    )
}

/** `::video{src="..."}` 的编辑器渲染描述符，编辑态与只读态共用 */
export const VideoDirectiveDescriptor: DirectiveDescriptor = {
    name: "video",
    type: "leafDirective",
    testNode(node) {
        return node.name === "video"
    },
    attributes: ["src"],
    hasChildren: false,
    Editor: VideoDirectiveEditor,
}

/** 生成可直接插入编辑器的指令文本；只保留摘出来的链接，不写入分享文案 */
export function buildVideoDirective(input: string): string | null {
    const href = extractVideoUrl(input)
    if (!href) return null
    return `\n\n::video{src="${href.replace(/"/g, "%22")}"}\n\n`
}
