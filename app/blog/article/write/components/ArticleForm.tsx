"use client"
import { toast } from "sonner";
import { createPost, updatePost } from "@/service/post"
import { addPostSchema } from "@/validators/post";

import { FooterButtons, Form } from "@/components/k-view";
import { useCustomFormSubmit } from "@/hooks/useAutoFormSubmit";
import type { PostWithFavorites } from "@/types/post";

type ArticleFormProps = {
    postId?: number
    defaultValue?: PostWithFavorites | null
}


export function ArticleForm({ postId, defaultValue }: ArticleFormProps) {
    const { formInstance, onSubmit } = useCustomFormSubmit(postId ? updatePost : createPost, {
        isResetForm: true,
        submitSuccessAction: (res) => {
            toast.success(res.message || '发布成功')
        }
    })

    return (

        <Form
            ref={formInstance}
            defaultValues={defaultValue ?? undefined}
            schema={addPostSchema}
            withSubmit={false}
        >
            <FooterButtons
                cancelText={'存为草稿'}
                confirmText={'发布'}
                onConfirm={() => onSubmit({ id: postId })}
                onCancel={() => onSubmit({ status: 2, id: postId })}
            />
        </Form>

    )
}
