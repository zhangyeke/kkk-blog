import {z} from "zod"

/*新增文章校验*/
export const addPostSchema = z.object({
    title: z.string('请输入标题').max(30, '标题长度不能超过30位').nonempty('标题不能为空'),
    cover: z.string('请上传封面').nonempty('封面不能为空').url('封面必须是一个有效的URL地址'),
    categoryId: z.int('分类不能为空'),
    tags: z.string('请输入标签').nonempty('标签不能为空'),
    content: z.string('请输入内容').nonempty('内容不能为空'),
})
