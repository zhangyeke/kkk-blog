"use client"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import React from "react"
import Link from "next/link";
import {toast} from "sonner";
import {Button} from "@/components/ui/button"
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {login} from "@/service/auth"
import {loginSchema} from "@/validators/auth"
import {LoginParams} from "@/types/ahth";
import {useRouter} from "next/navigation";


export function LoginForm({callbackUrl}: { callbackUrl: string }) {
    const router = useRouter()
    const [data, action, pending] = React.useActionState(login, {
        code: -1,
        message: ""
    })

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        },
    })

    function handleSubmit(values: LoginParams) {
        React.startTransition(() => {
            action(values)
        })
    }

    React.useEffect(() => {
        const {code, message} = data
        if (code === 0 && message) {
            toast.error(message)
        } else if (code === 200) {
            toast.success(message)
            router.replace(callbackUrl)
        }

    }, [data])


    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-5">
                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>邮箱地址</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入邮箱地址" {...field} autoComplete={'username'}/>
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
                                <Input placeholder="请输入密码" {...field} type={"password"}
                                       autoComplete={'current-password'}/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>

                    )}
                />

                <Button disabled={data.code === 200} long={true} type={"submit"} loading={pending}>
                    登录
                </Button>
                <Link className={'text-gray-500 text-center block  text-sm  hover:underline'} href={"/register"}>
                    还没有账号? 去注册
                </Link>
            </form>
        </Form>
    )
}

