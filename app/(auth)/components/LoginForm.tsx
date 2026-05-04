/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-04 17:57:31
 * @FilePath: \blog\app\(auth)\components\LoginForm.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-04 17:20:06
 * @FilePath: \blog\app\(auth)\components\LoginForm.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React from "react"
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button"
import { loginSchema } from "@/validators/auth"
import { useRouter } from "next/navigation";
import { Division, Form, Image } from "@/components/k-view"
import { useCustomFormSubmit } from "@/hooks/useAutoFormSubmit";
import { CustomPasswordInput } from "./CustomPasswordInput";
import { CustomInput } from "./CustomInput";

import { login, providerLogin } from "@/service/auth"

const AUTH_ERROR_MESSAGES = {
    OAuthAccountNotLinked:
        '该邮箱已注册过本站账号（例如邮箱密码登录）。请先使用邮箱密码登录；若要与 GitHub 绑定，需在登录后另行实现「关联社交账号」。',
    AccessDenied: '登录被拒绝，请重试或换一种登录方式。',
    Configuration: '登录服务配置有误，请联系管理员。',
    Verification: '验证链接无效或已过期，请重新申请。',
}

interface LoginFormProps {
    callbackUrl: string
    authError?: string
}


function LoginForm({ callbackUrl, authError }: LoginFormProps) {
    const router = useRouter()
    const [loading, setLoading] = React.useState(false)

    const { onSubmit, pending, formInstance } = useCustomFormSubmit(login, {
        isResetForm: true,
        submitSuccessAction: res => {
            toast.success(res.message)
            router.replace(callbackUrl)
        }
    })

    const handleProviderLogin = async (provider: string) => {
        setLoading(true)
        await providerLogin(provider)
        setLoading(false)
    }

    React.useEffect(() => {
        if (!authError) return
        const message =
            AUTH_ERROR_MESSAGES[authError] ?? `登录遇到问题（${authError}），请稍后再试。`
        toast.error(message)
        const url = new URL(window.location.href)
        url.searchParams.delete('error')
        router.replace(`${url.pathname}${url.search}`)
    }, [authError, router])

    return (
        <>
            <Form ref={formInstance} schema={loginSchema} withSubmit={false} formComponents={{
                customPassword: CustomPasswordInput,
                customEmail: CustomInput
            }}>
                <div className={'text-gray-500 text-right  text-sm mt-5'}>
                    还没有账号?
                    <Link className={' text-sm hover:underline '} href={"/register"}>
                        去注册
                    </Link>
                </div>
                <Button
                    type={'button'}
                    loading={pending || loading}
                    className={'w-full'}
                    size={'lg'}
                    onClick={onSubmit}
                >登录</Button>

            </Form>

            <Division className="mt-5">
                其他登录方式
            </Division>

            <div className="flex-center gap-x-2 mt-2" >
                <Image
                    title="github登录"
                    className="size-10 cursor-pointer"
                    src='/images/searchIcons/github.png'
                    onClick={() => handleProviderLogin('github')}
                />
            </div>
        </>

    )

}

export default LoginForm