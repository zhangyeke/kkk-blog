"use server"
import {isRedirectError} from "next/dist/client/components/redirect-error";
import {hashSync} from "bcrypt-ts-edge";
import {loginSchema, registerSchema} from "@/validators/auth"

import {signIn, signOut} from "@/lib/auth"
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack"
import {LoginParams, RegisterParams} from "@/types/ahth";
import {createUser, getUserByEmail} from "@/service/user";


/*登录*/
export async function login(preState: unknown, formData: LoginParams) {
    try {
        const user = loginSchema.parse(formData)
        await signIn('credentials', {
            ...user,
            redirect: false
        })
        return backSuccessMessage('登录成功')
    } catch (err) {
        console.log("登录失败", err)

        if (isRedirectError(err)) {
            throw err
        }
        return backFailMessage('用户不存在或密码错误')
    }
}

// 邮箱查重
export async function emailPlagiarismCheck(email: string) {
    const user = await getUserByEmail(email)

    return !!user
}

/*退出登录*/
export async function logout() {
    try {
        await signOut({
            redirect: false
        })
        return backSuccessMessage("退出登录成功")
    } catch (err) {
        return backFailMessage("退出登录失败")
    }

}

/*注册*/
export async function register(preState: unknown, formData: RegisterParams) {
    try {
        const user = await registerSchema.parseAsync(formData)
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
        if (isRedirectError(err)) {
            throw err
        }
        console.log("注册失败", err)

        return backFailMessage("注册失败", err)
    }
}