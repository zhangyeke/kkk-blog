"use client"
import React from "react"
import Link from "next/link";
import {toast} from "sonner";
import {Button} from "@/components/ui/button"
import {loginSchema} from "@/validators/auth"
import {useRouter} from "next/navigation";
import {Form} from "@/components/k-view"
import {useCustomFormSubmit} from "@/hooks/useAutoFormSubmit";
import {CustomPasswordInput} from "./CustomPasswordInput";
import {CustomInput} from "./CustomInput";

import {login} from "@/service/auth"


function LoginForm({callbackUrl}: { callbackUrl: string }) {
    const router = useRouter()

    const {onSubmit, pending, formInstance} = useCustomFormSubmit(login, {
        isResetForm: true,
        submitSuccessAction: res => {
            toast.success(res.message)
            router.replace(callbackUrl)
        }
    })

    return (
        <Form ref={formInstance} schema={loginSchema} withSubmit={false} formComponents={{
            customPassword: CustomPasswordInput,
            customEmail: CustomInput
        }}>
            <Button type={'button'} loading={pending} className={'w-full mt-5'} size={'lg'}
                    onClick={onSubmit}>登录</Button>
            <div className={'text-gray-500 text-center  text-sm mt-5'}>
                还没有账号?
                <Link className={'text-base text-sm hover:underline '} href={"/register"}>
                    去注册
                </Link>
            </div>

        </Form>
    )

}

export default LoginForm