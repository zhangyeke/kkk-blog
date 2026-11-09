"use client"

import React from "react"
import { Video } from "lucide-react"
import { ButtonWithTooltip } from "@mdxeditor/editor"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, FooterButtons } from "@/components/k-view/Popup"
import { buildVideoDirective, extractVideoUrl, isEmbedCode, resolveVideoSource, VideoEmbed } from "./video-directive"

interface InsertVideoProps {
    /** 由 MarkedEditor 提供，调用 editorRef.insertMarkdown 落到当前光标 */
    onInsert: (markdown: string) => void
}

/** 工具栏按钮 + 地址输入弹层，插入 `::video{src="..."}` 指令 */
export function InsertVideo({ onInsert }: InsertVideoProps) {
    const [open, setOpen] = React.useState(false)
    const [input, setInput] = React.useState("")

    const extracted = React.useMemo(() => extractVideoUrl(input), [input])
    const source = React.useMemo(() => resolveVideoSource(input), [input])
    const canInsert = source !== null
    /** 粘贴的是「标题 + 链接」的分享文案或整段嵌入代码，而不是裸链接 */
    const fromRichInput = extracted !== null && extracted !== input.trim()
    const fromEmbedCode = React.useMemo(() => isEmbedCode(input), [input])

    const handleInsert = React.useCallback(() => {
        const markdown = buildVideoDirective(input)
        if (!markdown) return
        setInput("")
        setOpen(false)
        // 等弹窗卸载、焦点交还页面后再插入，否则编辑器拿不到选区
        requestAnimationFrame(() => onInsert(markdown))
    }, [onInsert, input])

    return (
        <>
            <ButtonWithTooltip title="插入视频" onClick={() => setOpen(true)}>
                <Video/>
            </ButtonWithTooltip>

            <Dialog
                open={open}
                onOpenChange={setOpen}
                title="插入视频"
                description="粘贴视频链接、B 站 / 油管的分享文案，或后台复制的 iframe 嵌入代码，都会自动提取地址"
                contentClassName="gap-0 sm:max-w-2xl"
                footer={
                    <FooterButtons className="px-6">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            取消
                        </Button>
                        <Button type="button" onClick={handleInsert} disabled={!canInsert}>
                            插入
                        </Button>
                    </FooterButtons>
                }
            >
                <div className="space-y-3 px-6 py-4">
                    <Input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && canInsert) {
                                event.preventDefault()
                                handleInsert()
                            }
                        }}
                        placeholder="请输入视频地址或者视频分享链接"
                        aria-label="视频地址"
                        spellCheck={false}
                    />

                    {input.trim() !== "" && (
                        canInsert ? (
                            <div className="space-y-2">
                                {fromRichInput && (
                                    <p className="line-clamp-1 text-xs text-muted-foreground" title={extracted ?? undefined}>
                                        {fromEmbedCode ? "已从嵌入代码中提取：" : "已从分享文案中提取："}
                                        <span className="font-mono">{extracted}</span>
                                    </p>
                                )}
                                {source?.kind === "link" && (
                                    <p className="text-xs text-muted-foreground">
                                        抖音不支持站外嵌入，插入后会显示为可点击的跳转卡片
                                    </p>
                                )}
                                <VideoEmbed src={input}/>
                            </div>
                        ) : (
                            <p className="text-xs text-destructive">
                                没有找到可用的视频链接，请粘贴完整地址（YouTube / Bilibili 链接，或 mp4、webm 等视频直链）
                            </p>
                        )
                    )}
                </div>
            </Dialog>
        </>
    )
}
