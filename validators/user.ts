import { z } from "zod"
import { fieldConfig } from "@autoform/zod"
import { publicUserSchema } from "./auth"
import dayjs from "dayjs"
import { str2num } from "@/lib/number"
import { isAfterToday } from "@/lib/date"

/*更新用户校验*/
export const updateUserSchema = z
  .object({
    avatar: z.preprocess((arg) => {
      if (!arg) return ""
      return arg
    }, z.string().optional()),
    ...publicUserSchema,
    gender: z.preprocess(
      (s) => {
        if (typeof s === "string") {
          return str2num(s)
        }
        return s
      },
      z.number({ message: "请选择性别" }).optional()
    ),
    birthday: z.preprocess(
      (arg) => {
        if (typeof arg == "string" || arg instanceof Date || typeof arg === "number") {
          const d = dayjs(arg)
          // 3. 验证日期是否有效，有效则转回原生 Date 对象供 Prisma 使用
          return d.isValid() ? d.toDate() : undefined
        }
      },
      z.date({ message: "请选择出生日期" }).optional()
    ),
  })
  .refine((data) => !isAfterToday(data.birthday), {
    message: "出生日期不能超过今天",
    path: ["birthday"],
  })

export type UpdateUserSchema = z.infer<typeof updateUserSchema>

/** 后台用户新增 / 编辑表单。服务端也复用这份 schema 做字段校验。 */
export const adminUserFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "昵称不能为空")
      .max(10, "昵称长度不能超过10位")
      .superRefine(
        fieldConfig({ label: "昵称", inputProps: { placeholder: "请输入昵称", autoComplete: "off", maxLength: 10 } })
      ),
    email: z
      .string()
      .trim()
      .email("请输入正确的邮箱")
      .max(254, "邮箱长度过长")
      .superRefine(
        fieldConfig({
          label: "邮箱",
          inputProps: { placeholder: "请输入邮箱", type: "email", autoComplete: "email", maxLength: 254 },
        })
      ),
    roles: z
      .string()
      .trim()
      .min(1, "请选择角色")
      .superRefine(
        fieldConfig({ label: "角色", fieldType: "userRoleSelect", inputProps: { placeholder: "请选择角色" } })
      ),

    password: z
      .string()
      .optional()
      .superRefine(
        fieldConfig({
          label: "密码",
          description: "新增时可留空以允许 OAuth 登录，编辑时留空表示不修改",
          inputProps: { placeholder: "至少 6 位", type: "password", autoComplete: "new-password" },
        })
      ),
    avatar: z
      .string()
      .url("封面必须是一个有效的URL地址")
      .optional()
      .superRefine(
        fieldConfig({
          label: "头像",
          fieldType: "imageUpload",
          inputProps: {
            placeholder: "请上传头像",
          },
        })
      ),
  })
  .superRefine((data, context) => {
    if (data.avatar && !z.string().url().safeParse(data.avatar).success) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["avatar"], message: "头像地址格式不正确" })
    }
    if (data.password && data.password.length < 6) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: "密码长度不能小于6位" })
    }
  })

export type AdminUserFormValue = z.infer<typeof adminUserFormSchema>
