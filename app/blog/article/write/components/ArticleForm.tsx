"use client"
import { toast } from "sonner";
import { createPost, updatePost } from "@/service/post"
import { addPostSchema } from "@/validators/post";

import { Button } from "@/components/ui/button";
import { FooterButtons } from "@/components/k-view/Popup/FooterButtons";
import { Form } from "@/components/k-view/Form";
import { useCustomFormSubmit } from "@/hooks/useAutoFormSubmit";
import type { PostWithFavorites } from "@/types/post";

/**
 * 文章表单（新增 / 编辑共用）。
 *
 * 两套外壳：
 * - `page`（默认）：独立页面用，底部只有「存为草稿 / 发布」，行为与改造前完全一致；
 * - `dialog`：后台列表弹窗用，多一个「取消」，并在提交成功后回调 onSuccess
 *   让弹窗自己关掉 + 刷新列表。
 */
type ArticleFormProps = {
    postId?: number
    defaultValue?: PostWithFavorites | null
    /** page = 现有行为（存为草稿 / 发布）；dialog = 多一个「取消」并回调 onCancel */
    variant?: "page" | "dialog"
    /** 提交成功后的回调（弹窗用来关闭自己并刷新列表） */
    onSuccess?: () => void
    /** 弹窗里的「取消」 */
    onCancel?: () => void
}


export function ArticleForm({ postId, defaultValue, variant = "page", onSuccess, onCancel }: ArticleFormProps) {
    const { formInstance, onSubmit, pending } = useCustomFormSubmit(postId ? updatePost : createPost, {
        isResetForm: true,
        submitSuccessAction: (res) => {
            toast.success(res.message || '发布成功')
            // 弹窗外壳需要「成功后收尾」，页面外壳不传即无副作用
            onSuccess?.()
        }
    })

    const isDialog = variant === "dialog"

    return (

        <Form
            ref={formInstance}
            defaultValues={defaultValue ?? undefined}
            schema={addPostSchema}
            withSubmit={false}
            className={isDialog ? "flex min-h-0 flex-1 flex-col space-y-0 px-0" : undefined}
            fieldsClassName={isDialog ? "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-2 sm:px-7" : undefined}
        >
            {isDialog ? (
                <FooterButtons className="shrink-0 flex-wrap gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-paper-2)] px-4 sm:gap-4 sm:px-7">
                    <Button
                        type={'button'}
                        variant="outline"
                        onClick={() => onCancel?.()}
                        disabled={pending}
                    >
                        取消
                    </Button>
                    <Button
                        type={'button'}
                        variant="outline"
                        onClick={() => onSubmit({ status: 2, id: postId })}
                        disabled={pending}
                    >
                        存为草稿
                    </Button>
                    <Button
                        type={'button'}
                        onClick={() => onSubmit({ id: postId })}
                        disabled={pending}
                    >
                        发布
                    </Button>
                </FooterButtons>
            ) : (
                <FooterButtons
                    cancelText={'存为草稿'}
                    confirmText={'发布'}
                    onConfirm={() => onSubmit({ id: postId })}
                    onCancel={() => onSubmit({ status: 2, id: postId })}
                />
            )}
        </Form>

    )
}
