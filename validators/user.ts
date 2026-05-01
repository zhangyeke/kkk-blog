import {z} from "zod"
import {publicUserSchema} from "./auth";
import dayjs from "dayjs";
import {str2num} from "@/lib/utils";
import {isAfterToday} from "@/lib/date";



/*更新用户校验*/
export const updateUserSchema = z.object({
    avatar: z.preprocess((arg) => {
        if (!arg) return ''
        return arg
    }, z.string().optional()),
    ...publicUserSchema,
    gender: z.preprocess((s) => {
        if (typeof s === 'string') {
            return str2num(s)
        }
        return s
    }, z.number({message: "请选择性别"}).optional()),
    birthday: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date || typeof arg === 'number') {
            const d = dayjs(arg);
            // 3. 验证日期是否有效，有效则转回原生 Date 对象供 Prisma 使用
            return d.isValid() ? d.toDate() : undefined;
        }
    }, z.date({message: "请选择出生日期"}).optional()),
}).refine((data) => !isAfterToday(data.birthday), {
    message: "出生日期不能超过今天",
    path: ['birthday']
})

export type UpdateUserSchema = z.infer<typeof updateUserSchema>
