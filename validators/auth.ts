import {z} from "zod"
import {emailPlagiarismCheck} from "@/service/auth";

/*登录校验*/
export const loginSchema = z.object({
    email: z.string().email("请输入正确的邮箱"),
    password: z.string().min(6, "密码长度不能小于6位"),
})

/*注册检验*/
export const registerSchema = loginSchema.extend({
    name: z.string().nonempty("用户名不能为空").max(10, "昵称长度不能超过10位"),
    confirmPassword: z.string().min(6, "确认密码长度不能小于6位"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "密码不一致",
    path: ['confirmPassword']
}).refine(async (data) => {
    const isEmailOk = await emailPlagiarismCheck(data.email)
    return !isEmailOk
}, {
    message: "该邮箱已被注册",
    path: ['email']
})

