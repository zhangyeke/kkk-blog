"use client"
import React from "react"
import {toast} from "sonner";
import {createPost} from "@/service/post"
import {addPostSchema,} from "@/validators/post";

import {FooterButtons, Form} from "@/components/k-view";
import {useCustomFormSubmit} from "@/hooks/useAutoFormSubmit";


export function ArticleForm() {
    const {formInstance, onSubmit} = useCustomFormSubmit(createPost, {
        isResetForm: true,
        submitSuccessAction: (res) => {
            toast.success(res.message || '发布成功')
        }
    })

    return (

        <Form
            ref={formInstance}
            schema={addPostSchema}
            withSubmit={false}
        >
            <FooterButtons
                cancelText={'存为草稿'}
                confirmText={'发布'}
                onConfirm={() => onSubmit()}
                onCancel={() => onSubmit({status: 2})}
            />
        </Form>

    )
}
