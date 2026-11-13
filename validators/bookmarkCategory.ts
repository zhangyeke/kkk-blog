import { z } from "zod"
import { fieldConfig } from "@autoform/zod"
import { STATUS_OPTIONS } from "@/assets/enumerate/global"

/**
 * 书签分类表单校验（schema 驱动渲染，同 `validators/postCategory.ts`）。
 * 名称长度上限 100 与 `saveAdminBookmarkCategory` 保持一致。
 */
export const bookmarkCategorySchema = z.object({
    name: z
        .string()
        .min(1, "分类名称不能为空")
        .max(100, "分类名称不能超过 100 个字")
        .superRefine(
            fieldConfig({
                label: "分类名称",
                description: "1-100 个字，全站唯一",
                inputProps: {
                    placeholder: "如 开发工具",
                    className: "admin-dialog-input",
                    autoComplete: "off",
                },
            }),
        ),
    status: z.number().int().min(0).max(1).superRefine(
        fieldConfig({
            label: "状态",
            fieldType: "statusSegment",
            inputProps: {
                ariaLabel: "书签分类状态",
                options: STATUS_OPTIONS,
                testIdPrefix: "bookmark-category-status",
            },
        }),
    ),
})

export type BookmarkCategoryFormValue = z.infer<typeof bookmarkCategorySchema>
