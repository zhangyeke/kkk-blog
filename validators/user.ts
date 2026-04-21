import {z} from "zod"
import {fieldConfig} from "@autoform/zod";
import {publicUserSchema} from "./auth";

/*更新用户校验*/
export const updateUserSchema = z.object({
    avatar: z.string().nonempty('头像不能为空').url('头像必须是一个有效的URL地址').superRefine(
        fieldConfig({
            label: "头像",
            fieldType: "imageUpload",
            inputProps: {
                placeholder: '请上传头像',
            }
        })
    ),
    ...publicUserSchema
})

