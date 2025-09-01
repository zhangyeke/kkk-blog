import {z} from "zod"


export const loginSchema = z.object({
    email: z.email("请输入正确的邮箱"),
    password: z.string().min(6, "密码长度不能小于6位"),
})

export const registerSchema = z.object({

}).extend(loginSchema)

