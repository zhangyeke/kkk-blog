import { z } from "zod"
import { ADMIN_SETTING_FIELD_TYPES, type AdminSettingFieldType } from "@/assets/enumerate/global"

export const adminSettingFieldTypeSchema = z.enum(ADMIN_SETTING_FIELD_TYPES)

export type { AdminSettingFieldType }

export const adminSettingOptionSchema = z.object({
    value: z.string().trim().min(1, "选项值不能为空").max(100),
    label: z.string().trim().min(1, "选项名称不能为空").max(100),
})

export const adminSettingConfigSchema = z.object({
    placeholder: z.string().max(120).optional(),
    options: z.array(adminSettingOptionSchema).max(100).optional(),
}).strict()

export const createAdminSettingGroupSchema = z.object({
    key: z.string().trim().regex(/^[a-z][a-z0-9_-]{1,79}$/, "标识需以小写字母开头，仅支持小写字母、数字、下划线和短横线"),
    name: z.string().trim().min(1, "请填写分组名称").max(100),
    description: z.string().trim().max(240).optional().default(""),
}).refine((group) => group.key !== "branding", {
    path: ["key"],
    message: "branding 是系统保留标识，请使用恢复后台品牌功能",
})

export const updateAdminSettingGroupSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1, "请填写分组名称").max(100),
    description: z.string().trim().max(240).optional().default(""),
})

const adminSettingFieldBaseSchema = z.object({
    groupKey: z.string().trim().min(1).max(80),
    key: z.string().trim().regex(/^[a-z][a-zA-Z0-9_-]{0,79}$/, "字段标识需以小写字母开头，仅支持字母、数字、下划线和短横线"),
    label: z.string().trim().min(1, "请填写字段名称").max(100),
    type: adminSettingFieldTypeSchema,
    required: z.boolean().default(false),
    description: z.string().trim().max(240).optional().default(""),
    config: adminSettingConfigSchema.default({}),
})

export const createAdminSettingFieldSchema = adminSettingFieldBaseSchema.superRefine((field, context) => {
    if ((field.type === "select" || field.type === "statusSegment") && !field.config.options?.length) {
        context.addIssue({code: "custom", path: ["config", "options"], message: "该控件至少需要一个选项"})
    }
})

export const updateAdminSettingFieldSchema = adminSettingFieldBaseSchema.omit({groupKey: true, key: true}).extend({
    id: z.number().int().positive(),
}).superRefine((field, context) => {
    if ((field.type === "select" || field.type === "statusSegment") && !field.config.options?.length) {
        context.addIssue({code: "custom", path: ["config", "options"], message: "该控件至少需要一个选项"})
    }
})

export const deleteAdminSettingFieldSchema = z.object({id: z.number().int().positive()})
export const deleteAdminSettingGroupSchema = z.object({id: z.number().int().positive()})

export const saveAdminSettingValuesSchema = z.object({
    groupKey: z.string().trim().min(1).max(80),
    values: z.record(z.unknown()),
})

export type AdminSettingFieldConfig = z.infer<typeof adminSettingConfigSchema>
