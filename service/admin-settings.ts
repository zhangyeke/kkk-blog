"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { z } from "zod"

import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { requireAction } from "@/lib/admin/guard"
import { ADMIN_ICON_NAMES } from "@/assets/enumerate/global"
import prisma from "@/lib/prisma"
import {
    ADMIN_BRANDING_GROUP_KEY,
    DEFAULT_ADMIN_BRANDING,
} from "@/lib/admin/settings-store"
import {
    createAdminSettingFieldSchema,
    createAdminSettingGroupSchema,
    deleteAdminSettingFieldSchema,
    deleteAdminSettingGroupSchema,
    saveAdminSettingValuesSchema,
    updateAdminSettingFieldSchema,
    updateAdminSettingGroupSchema,
} from "@/validators/admin-settings"

export type AdminSettingsActionResult = BaseResource<null>

function revalidateSettingsSurfaces(): void {
    revalidatePath("/admin", "layout")
    revalidatePath("/admin/settings")
    revalidatePath("/blog", "layout")
}

async function authorizeSettingsWrite(): Promise<AdminSettingsActionResult | null> {
    try {
        await requireAction("settings:update")
        const client = prisma as typeof prisma & {
            adminSettingGroup?: unknown
            adminSettingField?: unknown
        }
        if (!client.adminSettingGroup || !client.adminSettingField) {
            return backFailMessage("后台设置模型尚未加载，请重启开发服务器后再试")
        }
        return null
    } catch (error) {
        if (isRedirectError(error)) throw error
        const message = error instanceof Error ? error.message : "没有修改设置的权限"
        return backFailMessage(message)
    }
}

function errorResult(error: unknown, fallback: string): AdminSettingsActionResult {
    if (error instanceof z.ZodError) return backFailMessage(error.issues[0]?.message ?? "设置内容不合法")
    if (isRedirectError(error)) throw error
    if (error && typeof error === "object" && "code" in error && (error.code === "P2021" || error.code === "P2022")) {
        return backFailMessage("后台设置数据表尚未就绪，请先应用 Prisma 数据库迁移")
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        return backFailMessage("分组或字段标识已存在")
    }
    return backFailMessage(error instanceof Error ? error.message : fallback)
}

async function ensureBrandingGroup() {
    const group = await prisma.adminSettingGroup.upsert({
        where: {key: ADMIN_BRANDING_GROUP_KEY},
        create: {
            key: ADMIN_BRANDING_GROUP_KEY,
            name: "后台品牌",
            description: "管理后台侧栏品牌信息与浏览器标签图标。",
            isBuiltin: true,
            sort: 0,
        },
        update: {},
        select: {id: true},
    })

    const defaults = [
        {key: "name", label: "后台名称", type: "string", required: true, value: DEFAULT_ADMIN_BRANDING.name, sort: 0},
        {key: "subtitle", label: "后台副标题", type: "string", required: false, value: DEFAULT_ADMIN_BRANDING.subtitle, sort: 1},
        {key: "icon", label: "后台图标", type: "imageUpload", required: false, value: DEFAULT_ADMIN_BRANDING.icon, sort: 2},
        {key: "favicon", label: "浏览器标签图标", type: "imageUpload", required: false, value: DEFAULT_ADMIN_BRANDING.favicon, sort: 3},
    ] as const

    await Promise.all(defaults.map((field) => prisma.adminSettingField.upsert({
        where: {groupId_key: {groupId: group.id, key: field.key}},
        create: {
            ...field,
            groupId: group.id,
            config: {},
            value: field.value,
            isBuiltin: true,
        },
        update: {},
    })))

    return group
}

export async function createAdminSettingGroup(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const data = createAdminSettingGroupSchema.parse(input)
        await prisma.adminSettingGroup.create({
            data: {
                ...data,
                description: data.description || null,
                sort: ((await prisma.adminSettingGroup.aggregate({_max: {sort: true}}))._max.sort ?? -1) + 1,
            },
        })
        revalidateSettingsSurfaces()
        return backSuccessMessage("配置分组已创建")
    } catch (error) {
        return errorResult(error, "创建配置分组失败")
    }
}

export async function updateAdminSettingGroup(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const data = updateAdminSettingGroupSchema.parse(input)
        const group = await prisma.adminSettingGroup.findUnique({where: {id: data.id}, select: {key: true, isBuiltin: true}})
        if (!group) return backFailMessage("配置分组不存在")
        if (group.isBuiltin && group.key !== ADMIN_BRANDING_GROUP_KEY) return backFailMessage("此内置分组名称固定，不能修改")
        await prisma.adminSettingGroup.update({
            where: {id: data.id},
            data: {name: data.name, description: data.description || null},
        })
        revalidateSettingsSurfaces()
        return backSuccessMessage("配置分组已更新")
    } catch (error) {
        return errorResult(error, "更新配置分组失败")
    }
}

export async function deleteAdminSettingGroup(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const {id} = deleteAdminSettingGroupSchema.parse(input)
        const group = await prisma.adminSettingGroup.findUnique({where: {id}, select: {key: true, isBuiltin: true}})
        if (!group) return backFailMessage("配置分组不存在")
        if (group.isBuiltin && group.key !== ADMIN_BRANDING_GROUP_KEY) return backFailMessage("此内置分组不能删除")
        // deleteMany adds the built-in guard to the write itself. The FK's ON DELETE CASCADE
        // removes the group's fields and their stored values atomically with this delete.
        const deleted = await prisma.adminSettingGroup.deleteMany({where: {id, key: group.key, isBuiltin: group.isBuiltin}})
        if (deleted.count !== 1) return backFailMessage("分组状态已变化，请刷新页面后重试")
        revalidateSettingsSurfaces()
        return backSuccessMessage(group.key === ADMIN_BRANDING_GROUP_KEY
            ? "后台品牌配置已删除，界面将使用默认品牌"
            : "分组及其配置项已删除")
    } catch (error) {
        return errorResult(error, "删除配置分组失败")
    }
}

export async function restoreAdminBrandingGroup(): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        await ensureBrandingGroup()
        revalidateSettingsSurfaces()
        return backSuccessMessage("后台品牌配置已恢复")
    } catch (error) {
        return errorResult(error, "恢复后台品牌配置失败")
    }
}

export async function createAdminSettingField(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const data = createAdminSettingFieldSchema.parse(input)
        const group = data.groupKey === ADMIN_BRANDING_GROUP_KEY
            ? await ensureBrandingGroup()
            : await prisma.adminSettingGroup.findUnique({where: {key: data.groupKey}, select: {id: true}})
        if (!group) return backFailMessage("配置分组不存在")

        const maxSort = await prisma.adminSettingField.aggregate({where: {groupId: group.id}, _max: {sort: true}})
        await prisma.adminSettingField.create({
            data: {
                groupId: group.id,
                key: data.key,
                label: data.label,
                type: data.type,
                required: data.required,
                description: data.description || null,
                config: data.config as Prisma.InputJsonValue,
                value: initialFieldValue(data.type, data.config.options?.[0]?.value),
                sort: (maxSort._max.sort ?? -1) + 1,
            },
        })
        revalidateSettingsSurfaces()
        return backSuccessMessage("配置项已添加")
    } catch (error) {
        return errorResult(error, "添加配置项失败")
    }
}

function initialFieldValue(type: string, firstOption?: string): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    switch (type) {
        case "number": return Prisma.DbNull
        case "select":
        case "statusSegment": return firstOption ?? ""
        case "uploadFiles":
        case "regionCascader": return []
        default: return ""
    }
}

export async function updateAdminSettingField(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const data = updateAdminSettingFieldSchema.parse(input)
        const current = await prisma.adminSettingField.findUnique({
            where: {id: data.id},
            select: {isBuiltin: true, type: true, value: true},
        })
        if (!current) return backFailMessage("配置项不存在")
        if (current.isBuiltin) return backFailMessage("内置品牌字段定义固定，只能修改字段值")

        const typeChanged = data.type !== current.type
        const valueStillValid = data.type === "select" || data.type === "statusSegment"
            ? data.config.options?.some((option) => option.value === current.value) ?? false
            : true
        await prisma.adminSettingField.update({
            where: {id: data.id},
            data: {
                label: data.label,
                type: data.type,
                required: data.required,
                description: data.description || null,
                config: data.config as Prisma.InputJsonValue,
                ...(typeChanged || !valueStillValid
                    ? {value: initialFieldValue(data.type, data.config.options?.[0]?.value)}
                    : {}),
            },
        })
        revalidateSettingsSurfaces()
        return backSuccessMessage("配置项已更新")
    } catch (error) {
        return errorResult(error, "更新配置项失败")
    }
}

export async function deleteAdminSettingField(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const {id} = deleteAdminSettingFieldSchema.parse(input)
        const field = await prisma.adminSettingField.findUnique({where: {id}, select: {isBuiltin: true}})
        if (!field) return backFailMessage("配置项不存在")
        if (field.isBuiltin) return backFailMessage("内置品牌字段不能删除")
        const deleted = await prisma.adminSettingField.deleteMany({where: {id, isBuiltin: false}})
        if (deleted.count !== 1) return backFailMessage("配置项状态已变化，请刷新页面后重试")
        revalidateSettingsSurfaces()
        return backSuccessMessage("配置项已删除")
    } catch (error) {
        return errorResult(error, "删除配置项失败")
    }
}

function validateSettingValue(field: {
    key: string
    label: string
    type: string
    required: boolean
    config: Prisma.JsonValue
}, value: unknown): {ok: true; value: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput} | {ok: false; message: string} {
    const config = field.config && typeof field.config === "object" && !Array.isArray(field.config)
        ? field.config as Prisma.JsonObject
        : {}
    const options = Array.isArray(config.options)
        ? config.options.flatMap((option) => option && typeof option === "object" && "value" in option && typeof option.value === "string" ? [option.value] : [])
        : []
    const isEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)
    if (field.required && isEmpty) return {ok: false, message: `请填写「${field.label}」`}
    if (isEmpty) return {ok: true, value: Prisma.DbNull}

    switch (field.type) {
        case "number":
            if (typeof value !== "number" || !Number.isFinite(value)) return {ok: false, message: `「${field.label}」必须是有效数字`}
            break
        case "uploadFiles":
            if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && isSafeAssetUrl(item))) return {ok: false, message: `「${field.label}」文件值格式不正确`}
            break
        case "regionCascader":
            if (!Array.isArray(value) || value.length > 3 || !value.every((item) => typeof item === "string")) return {ok: false, message: `「${field.label}」地区值格式不正确`}
            break
        case "select":
        case "statusSegment":
            if (typeof value !== "string" || !options.includes(value)) return {ok: false, message: `「${field.label}」选项无效`}
            break
        case "iconPicker":
            if (typeof value !== "string" || !ADMIN_ICON_NAMES.includes(value as (typeof ADMIN_ICON_NAMES)[number])) return {ok: false, message: `「${field.label}」图标无效`}
            break
        case "imageUpload":
            if (typeof value !== "string" || !isSafeAssetUrl(value)) return {ok: false, message: `「${field.label}」图片地址无效`}
            break
        default:
            if (typeof value !== "string") return {ok: false, message: `「${field.label}」必须是文本`}
            if (value.length > (field.key === "name" ? 80 : 20000)) return {ok: false, message: `「${field.label}」内容过长`}
    }

    return {ok: true, value: value as Prisma.InputJsonValue}
}

function isSafeAssetUrl(value: string): boolean {
    if (!value.trim()) return true
    if (value.startsWith("/") && !value.startsWith("//")) return true
    try {
        const url = new URL(value)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch {
        return false
    }
}

export async function saveAdminSettingValues(input: unknown): Promise<AdminSettingsActionResult> {
    const denied = await authorizeSettingsWrite()
    if (denied) return denied

    try {
        const {groupKey, values} = saveAdminSettingValuesSchema.parse(input)
        if (groupKey === ADMIN_BRANDING_GROUP_KEY) await ensureBrandingGroup()
        const group = await prisma.adminSettingGroup.findUnique({
            where: {key: groupKey},
            include: {fields: true},
        })
        if (!group) return backFailMessage("配置分组不存在")

        const fields = new Map(group.fields.map((field) => [field.key, field]))
        const unknownKey = Object.keys(values).find((key) => !fields.has(key))
        if (unknownKey) return backFailMessage("提交的配置项已失效，请刷新页面后重试")

        const data: Array<{id: number; value: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput}> = []
        for (const field of group.fields) {
            const value = Object.prototype.hasOwnProperty.call(values, field.key) ? values[field.key] : field.value
            const isBrandIcon = group.key === ADMIN_BRANDING_GROUP_KEY && field.key === "icon"
            // Older installations stored icon names such as "book" here. Ignore those legacy
            // values when a client omits the field; the UI now treats this field as an image URL.
            const normalizedValue = isBrandIcon && (typeof value !== "string" || !isSafeAssetUrl(value)) ? "" : value
            const result = validateSettingValue(
                isBrandIcon ? {...field, type: "imageUpload", required: false} : field,
                normalizedValue,
            )
            if (!result.ok) return backFailMessage(result.message)
            if (Object.prototype.hasOwnProperty.call(values, field.key)) data.push({id: field.id, value: result.value})
        }

        if (data.length > 0) {
            await prisma.$transaction(data.map(({id, value}) => prisma.adminSettingField.update({where: {id}, data: {value}})))
        }
        revalidateSettingsSurfaces()
        return backSuccessMessage("设置已保存")
    } catch (error) {
        return errorResult(error, "保存设置失败")
    }
}
