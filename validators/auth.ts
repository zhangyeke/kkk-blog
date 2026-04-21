import {z} from "zod"

import {fieldConfig} from "@autoform/zod";

export const emailSchema = {
    email: z.string().email("请输入正确的邮箱").superRefine(
        fieldConfig({
            label: "邮箱地址",
            fieldType: "customEmail",
            inputProps: {
                placeholder: '请输入邮箱',
            }
        })
    ),
}

export const publicUserSchema = {
    name: z.string().nonempty("昵称不能为空").max(10, "昵称长度不能超过10位").superRefine(
        fieldConfig({
            label: "昵称",
            fieldType: "customNickName",
            inputProps: {
                placeholder: '请输入昵称',
            }
        })
    ),
    ...emailSchema
}

/*登录校验*/
export const loginSchema = z.object({
    ...emailSchema,
    password: z.string().min(6, "密码长度不能小于6位").superRefine(
        fieldConfig({
            label: "密码",
            fieldType: "customPassword",
            inputProps: {
                placeholder: '请输入密码',
            }
        })
    ),
})

/*注册检验*/
export const registerSchema = z.object({
    ...publicUserSchema,
    password: z.string().min(6, "密码长度不能小于6位").superRefine(
        fieldConfig({
            label: "密码",
            fieldType: "customPassword",
            inputProps: {
                placeholder: '请输入密码',
            }
        })
    ),
    confirmPassword: z.string().min(6, "确认密码长度不能小于6位").superRefine(
        fieldConfig({
            label: "确认密码",
            fieldType: "customPassword",
            inputProps: {
                placeholder: '请输入确认密码',
            }
        })
    ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "密码不一致",
    path: ['confirmPassword']
})
//.refine(async (data) => {
//     const isEmailOk = await emailPlagiarismCheck(data.email)
//     return !isEmailOk
// }, {
//     message: "该邮箱已被注册",
//     path: ['email']
// })

