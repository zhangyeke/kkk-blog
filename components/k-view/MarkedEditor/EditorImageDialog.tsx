"use client"

import {
    $createImageNode,
    activeEditor$,
    closeImageDialog$,
    type EditingImageDialogState,
    imageDialogState$,
    lexical,
    rootEditor$,
    saveImage$,
    useCellValues,
    usePublisher,
} from "@mdxeditor/editor"
import { useContext, useRef, useState } from "react"

import { AdminThemeContext } from "@/components/admin/admin-theme-context"
import UploadFileField from "@/components/k-view/Form/components/UploadFileField"
import { Dialog, FooterButtons } from "@/components/k-view/Popup"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/ui/cn"

export function EditorImageDialog() {
    const [state, activeEditor, rootEditor] = useCellValues(imageDialogState$, activeEditor$, rootEditor$)
    if (state.type === "inactive") return null

    return (
        <ImageForm
            key={state.type === "editing" ? state.nodeKey : "new"}
            editor={activeEditor ?? rootEditor}
            initialValues={state.type === "editing" ? state.initialValues : undefined}
        />
    )
}

function ImageForm({ editor, initialValues }: {
    editor: lexical.LexicalEditor | null
    initialValues?: EditingImageDialogState["initialValues"]
}) {
    const adminTheme = useContext(AdminThemeContext)
    const close = usePublisher(closeImageDialog$)
    const saveImage = usePublisher(saveImage$)
    const [uploads, setUploads] = useState({ urls: [] as string[], uploading: false, hasErrors: false })
    const selection = useRef<ReturnType<typeof lexical.$getSelection>>(null)
    const opener = useRef<HTMLElement | null>(null)
    const insertAfterClose = useRef<(() => void) | null>(null)
    const editing = initialValues !== undefined
    const tooManyImages = editing && uploads.urls.length > 1
    const canSubmit = editor !== null && uploads.urls.length > 0 && !tooManyImages && !uploads.uploading

    function handleSubmit() {
        if (!canSubmit) return
        if (initialValues) {
            saveImage({
                src: uploads.urls[0],
                altText: initialValues.altText,
                title: initialValues.title,
            })
            return
        }

        // 恢复打开弹窗时的选区，一次更新写入所有图片，顺序由上传列表决定。
        insertAfterClose.current = () => {
            editor.update(() => {
                if (selection.current) lexical.$setSelection(selection.current)
                lexical.$insertNodes(uploads.urls.map((src) =>
                    lexical.$createParagraphNode().append($createImageNode({ src, altText: "" })),
                ))
            })
            editor.focus()
        }
        close()
    }

    return (
        <Dialog
            open
            onOpenChange={(open) => { if (!open) close() }}
            title={editing ? "编辑图片" : "插入图片"}
            description={editing ? "替换图片时，请从列表移除原图，只保留一张。" : "可一次选择多张图片，也可以添加图片链接。"}
            contentClassName={cn(
                "z-120 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] min-w-0 flex-col gap-0 overflow-hidden sm:max-w-xl",
                adminTheme ? "admin-shell" : undefined,
            )}
            contentProps={{
                "data-preset": adminTheme?.preset,
                overlayClassName: "z-110",
                onOpenAutoFocus: () => {
                    selection.current = editor?.getEditorState().read(() => lexical.$getSelection()?.clone()) ?? null
                    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
                },
                onCloseAutoFocus: (event) => {
                    event.preventDefault()
                    const insert = insertAfterClose.current
                    insertAfterClose.current = null
                    if (insert) insert()
                    else if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
                },
            }}
            footer={
                <FooterButtons className="px-6">
                    <Button type="button" variant="outline" onClick={() => close()}>取消</Button>
                    <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
                        {editing ? "保存" : uploads.urls.length > 0 ? `插入 ${uploads.urls.length} 张图片` : "插入图片"}
                    </Button>
                </FooterButtons>
            }
        >
            <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
                <UploadFileField
                    accept="image/*"
                    placeholder="选择要上传的图片"
                    value={initialValues?.src}
                    onUploadStateChange={setUploads}
                    routeSelectContentClassName="z-130"
                />
                {uploads.hasErrors && (
                    <p className="text-sm text-destructive" role="status">
                        部分图片上传失败，可移除后重新选择。已上传的图片仍可使用。
                    </p>
                )}
                {tooManyImages && <p className="text-sm text-destructive" role="status">编辑图片时只能保留一张。</p>}
            </div>
        </Dialog>
    )
}
