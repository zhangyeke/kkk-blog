"use client"
import React from "react";
import {toast} from "sonner";
import Link from "next/link";
import {registerSchema} from "@/validators/auth";
import {Button} from "@/components/ui/button";
import {Form} from "@/components/k-view"
import {CustomPasswordInput} from "@/app/(auth)/components/CustomPasswordInput";
import {CustomInput} from "@/app/(auth)/components/CustomInput";
import {useCustomFormSubmit} from "@/hooks/useAutoFormSubmit";
import {register} from "@/service/auth";


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