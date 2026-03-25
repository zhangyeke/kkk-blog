import {z} from "zod"
import {fieldConfig, ZodProvider} from "@autoform/zod";
import {getPostCategoryList} from "@/service/postCategory";

/*新增文章校验*/
export const addPostSchema = z.object({
    // title: z.string({required_error: "标题不能为空"}).max(30, '标题长度不能超过30位').superRefine(
    //     fieldConfig({
    //         label: "标题",
    //         // description:"请输入标题",//用于在输入框下方添加提示信息
    //         // order: -1,//排序
    //         inputProps: {
    //             placeholder: '请输入标题',
    //         }
    //     })
    // ),
    // cover: z.string({required_error: '封面不能为空'}).url('封面必须是一个有效的URL地址').superRefine(
    //     fieldConfig({
    //         label: "封面",
    //         fieldType: "imageUpload",
    //         inputProps: {
    //             placeholder: '请上传封面',
    //         }
    //     })
    // ),
    // categoryId: z.number({required_error: '分类不能为空'}).superRefine(
    //     fieldConfig({
    //         label: "分类",
    //         fieldType: "remoteSelect",
    //         inputProps: {
    //             placeholder: '请选择分类',
    //             api: getPostCategoryList,
    //             labelKey: "name",
    //             valueKey: "id"
    //         }
    //     })
    // ),
    // tags: z.string({required_error: '标签不能为空'}).superRefine(
    //     fieldConfig({
    //         label: "标签",
    //         description: "多个标签请用逗号隔开",
    //         fieldType: "textarea",
    //         inputProps: {
    //             placeholder: '请输入标签(多个请用逗号隔开)',
    //         }
    //     })
    // ),
    content: z.string({required_error: '内容不能为空'}).superRefine(
        fieldConfig({
            label: "内容",
            fieldType: "markdown",
            inputProps: {
                placeholder: '请输入内容',
            }
        })
    ),
})

export const addPostSchemaProvider = new ZodProvider(addPostSchema);

console.log("校验", addPostSchemaProvider)
console.log(addPostSchema)