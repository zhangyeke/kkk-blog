"use client"
import React from "react";
import {toast} from "sonner";
import Link from "next/link";
import {signIn} from "next-auth/react";
import {emailPlagiarismCheck} from "@/service/auth";
import {registerSchema} from "@/validators/auth";
import {Button} from "@/components/ui/button";
import {Form} from "@/components/k-view"
import {CustomPasswordInput} from "@/app/(auth)/components/CustomPasswordInput";
import {CustomInput} from "@/app/(auth)/components/CustomInput";
import {useCustomFormSubmit} from "@/hooks/useAutoFormSubmit";
import {RegisterParams} from "@/types/ahth";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
import {hashSync} from "bcrypt-ts-edge";
import {createUser} from "@/service/user";


async function register(formData: RegisterParams) {
    try {
        const user = await registerSchema.parseAsync(formData)

        const isExisted = await emailPlagiarismCheck(user.email);

        if (isExisted) {
            return backFailMessage("该邮箱已被注册") // 手动返回业务错误
        }

        const originPwd = user.password
        // 加密密码
        user.password = hashSync(originPwd, 10)
        const {confirmPassword, ...userData} = user
        await createUser(userData)

        // 登录
        await signIn('credentials', {
            email: user.email,
            password: originPwd,
        })
        return backSuccessMessage("注册成功")
    } catch (err) {

        console.error("注册失败", err)

        return backFailMessage("注册失败", err)
    }
}


function RegisterForm() {

    const {onSubmit, pending, formInstance} = useCustomFormSubmit(register, {
        isResetForm: true,
        submitSuccessAction: res => {
            toast.success(res.message)
        }
    })


    return (
        <Form ref={formInstance} schema={registerSchema} withSubmit={false} formComponents={{
            customPassword: CustomPasswordInput,
            customNickName: CustomInput,
            customEmail: CustomInput
        }}>
            <Button
                className={'w-full mt-5'}
                type={'button'}
                loading={pending}
                size={'lg'}
                onClick={onSubmit}
            >注册</Button>
            <div className={'text-gray-500 text-center  text-sm mt-5'}>
                已有账号?
                <Link className={'text-base text-sm hover:underline '} href={"/login"}>
                    去登录
                </Link>
            </div>

        </Form>
    )

}

export default RegisterForm