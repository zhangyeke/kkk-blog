"use server"
import {isRedirectError} from "next/dist/client/components/redirect-error";
import {hashSync} from "bcrypt-ts-edge";
import {loginSchema, registerSchema} from "@/validators/auth"
import {auth, signIn, signOut, unstable_update} from "@/lib/auth"
import {
    ActionError,
    AUTH_FAIL_CODE,
    backAuthFailMessage,
    backFailMessage,
    backSuccessMessage
} from "@/lib/actionMessageBack"
import {LoginParams, RegisterParams} from "@/types/ahth";
import {createUser, getUserByEmail} from "@/service/user";
import {Session} from "next-auth";


export async function safeAction<T>(actionFn: () => Promise<T>, failMessage = '操作失败请稍后再试') {
    try {
        return await actionFn();
    } catch (err) {
        // 统一拦截处理
        if (err instanceof ActionError) {
            return backAuthFailMessage("认证失败，请重新登录");
        }

        return backFailMessage(failMessage, err);
    }
}

export async function updateAuth(data: Session['user']) {
    return safeAction(async () => {
        await unstable_update({
            user: data
        })
        return backSuccessMessage('更新成功')
    }, '更新失败')
}


/*登录*/
export async function login(formData: LoginParams) {
    try {
        const user = loginSchema.parse(formData)
        await signIn('credentials', {
            ...user,
            redirect: false
        })
        return backSuccessMessage('登录成功')
    } catch (err) {

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
    // try {
    //     await signOut({
    //         redirect: false
    //     })
    //     return backSuccessMessage("退出登录成功")
    // } catch (err) {
    //     return backFailMessage("退出登录失败")
    // }

    await signOut()
}

/*注册*/
export async function register(formData: RegisterParams) {
    try {

        const user = await registerSchema.parseAsync(formData)

        const isExisted = await emailPlagiarismCheck(user.email);

        if (isExisted) {
            return backFailMessage("该邮箱已被注册")// 手动返回业务错误
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
        if (isRedirectError(err)) {
            throw err
        }
        console.error("注册失败", err)

        return backFailMessage("注册失败", err)
    }
}


export async function checkAuth() {
    const session = await auth();

    // 如果未登录，抛出包含 401 状态码的异常
    if (!session || !session.user) {
        throw new ActionError("请先登录", AUTH_FAIL_CODE);
    }

    // 校验成功，返回用户信息
    return session.user;
}
