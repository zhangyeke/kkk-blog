import { z } from "zod"
import { fieldConfig } from "@autoform/zod"
import { ADMIN_ICON_NAMES, STATUS_OPTIONS } from "@/assets/enumerate/global"

/**
 * 文章分类表单校验。
 *
 * 字段的 label / 控件类型 / 输入属性都挂在 schema 上，
 * `components/k-view/Form` 会自动渲染出表单，不需要手写 useState + onChange。
 * 这里刻意不 trim —— 服务端 `normalizeCategoryName` 已经统一处理，
 * autoform 对嵌套 ZodEffects 的解析不稳定，避免多套一层。
 */
export const postCategorySchema = z.object({
    name: z
        .string()
        .min(1, "分类名称不能为空")
        .max(20, "分类名称不能超过 20 个字")
        .superRefine(
            fieldConfig({
                label: "分类名称",
                description: "1-20 个字，全站唯一",
                inputProps: {
                    placeholder: "如 学习笔录",
                    className: "admin-dialog-input",
                    autoComplete: "off",
                },
            }),
        ),
    icon: z.string().optional().superRefine(
        fieldConfig({
            label: "图标",
            fieldType: "iconPicker",
            description: "与侧栏菜单共用同一份图标字典",
            inputProps: {
                options: ADMIN_ICON_NAMES,
                placeholder: "图标名，如 posts",
                ariaLabel: "选择分类图标",
                emptyLabel: "无图标",
                columns: 6,
            },
        }),
    ),
    status: z.number().int().min(0).max(1).superRefine(
        fieldConfig({
            label: "状态",
            fieldType: "statusSegment",
            inputProps: {
                ariaLabel: "分类状态",
                options: STATUS_OPTIONS,
                testIdPrefix: "post-category-status",
            },
        }),
    ),
})

export type PostCategoryFormValue = z.infer<typeof postCategorySchema>
