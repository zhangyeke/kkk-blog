"use client"
import React from "react"
import {toast} from "sonner";
import {createPost} from "@/service/post"
import {FooterButtons, FooterButtonsProps, Form, FormInstance} from "@/components/k-view"
import {addPostSchema} from "@/validators/post";
import {addPostParams} from "@/types/post";


export function ArticleForm({type}: Pick<FooterButtonsProps, 'type'>) {
    const formRef = React.useRef<FormInstance<addPostParams>>(null)
    const [data, action, pending] = React.useActionState(createPost, undefined)


    const formItems = [
        {
            prop: "title",
            label: "标题",
        },
        {
            prop: "cover",
            label: "封面",
        },
        {
            prop: "categoryId",
            label: "分类",
        },
        {
            prop: "tags",
            label: "标签",
        },
        {
            prop: "content",
            label: "内容",
        }
    ]

    function handleSubmit() {
        console.log("打印")
        formRef.current?.submit((values) => {
            React.startTransition(() => {
                action(values)
            })
        })()

    }

    React.useEffect(() => {
        console.log("发生了什么", data)
        // const {code, message} = data
        // if (code === 0 && message) {
        //     toast.error(message)
        // } else if (code === 200) {
        //     toast.success(message)
        // }

    }, [data])


    return (
        <Form ref={formRef} items={formItems} formResolver={addPostSchema}>
            <FooterButtons type={type} onConfirm={handleSubmit}/>
        </Form>
    )
}

