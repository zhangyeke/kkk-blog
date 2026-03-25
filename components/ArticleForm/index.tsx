"use client"
import React, {useState} from "react"
import {toast} from "sonner";
import {createPost} from "@/service/post"
import {addPostSchemaProvider} from "@/validators/post";
import {AutoForm} from "@/components/ui/autoform";
import {useAutoFormSubmit} from "@/hooks";
import {Button} from "@/components/ui/button";


/*
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
/!*        {
            prop: "categoryId",
            label: "分类",
        },*!/
        {
            prop: "tags",
            label: "标签",
        },
        {
            prop: "content",
            label: "内容",
            control: "markdown"
        }
    ]

    function handleSubmit() {
        formRef.current?.submit((values) => {
            console.log("打印",values)
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

*/


export function ArticleForm() {
    const {pending, onSubmit} = useAutoFormSubmit(createPost)
    return (
        <>
            <AutoForm
                schema={addPostSchemaProvider}
                withSubmit
                uiComponents={{
                    SubmitButton: () => <Button loading={pending} type={'submit'}>提交</Button>
                }}
                onSubmit={onSubmit}

            >

            </AutoForm>

        </>
    )
}