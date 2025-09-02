"use client"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import React from "react"
import {Button} from "@/components/ui/button"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {loginAction} from "@/service/Auth"
import {LoginParams} from "@/types/ahth";

const formSchema = z.object({
    email: z.email("请输入正确的邮箱"),
    password: z.string().min(6, "密码长度不能小于6位"),
})

async function login() {
    const res = await loginAction()
    console.log("登录操作", res)
    return true
}

export function LoginForm() {
    const [_, action, pending] = React.useActionState(login, false)

    // ...
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: ""
        },
    })

    // 2. Define a submit handler.
    function handleSubmit(values: LoginParams) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        React.startTransition(() => {
            action()
        })
        console.log("快快快", values)
    }

    //
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>邮箱地址</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入邮箱地址" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>密码</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入密码" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>

                    )}
                />
                <Button long={true} type={"submit"} loading={pending}>
                    登录
                </Button>
            </form>
        </Form>
    )
}

