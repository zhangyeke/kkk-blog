"use client"

import React from "react"
import { PlayCircle, Trash2 } from "lucide-react"
import type { DirectiveDescriptor, DirectiveEditorProps } from "@mdxeditor/editor"

import { cn } from "@/lib/ui/cn"
import { extractVideoUrl, resolveVideoSource } from "@/lib/video-source"

export { extractVideoUrl, isEmbedCode, resolveVideoSource } from "@/lib/video-source"
export type { VideoSource } from "@/lib/video-source"

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
