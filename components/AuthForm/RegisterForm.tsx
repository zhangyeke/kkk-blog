"use client"
import React from "react";
import {register} from "@/service/auth";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {registerSchema} from "@/validators/auth";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {RegisterParams} from "@/types/ahth";

export default function RegisterForm() {

    const [_, action, pending] = React.useActionState(register, {
        message: "",
        code: 0
    })


    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        },
    })


    function handleSubmit(values: RegisterParams) {
        React.startTransition(() => {
            action(values)
            form.reset()
        })
    }

    return (
        <Form  {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-5">
                <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>用户呢称</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入用户呢称" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>邮箱地址</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入邮箱地址" {...field} autoComplete='username'/>
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
                                       autoComplete='current-password'/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>

                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>确认密码</FormLabel>
                            <FormControl>
                                <Input placeholder="请输入密码" {...field} type={"password"}
                                       autoComplete='new-password'/>
                            </FormControl>
                            <FormMessage/>
                        </FormItem>

                    )}
                />

                <Button long={true} type={"submit"} loading={pending}>
                    注册
                </Button>
                <Link className={'text-gray-500 text-center text-sm block hover:underline'} href={"/login"}>
                    已有账号? 去登录
                </Link>
            </form>
        </Form>
    )
}
