import "server-only"

import { cache } from "react"
import type { Prisma } from "@prisma/client"

import { ADMIN_SETTING_FIELD_TYPES, type AdminSettingFieldType } from "@/assets/enumerate/global"
import { GLOBAL_TITLE } from "@/config/blog"
import prisma from "@/lib/prisma"
import {
    adminSettingConfigSchema,
    type AdminSettingFieldConfig,
} from "@/validators/admin-settings"

export const ADMIN_BRANDING_GROUP_KEY = "branding"

export type AdminSettingFieldView = {
    id: number
    key: string
    label: string
    type: AdminSettingFieldType
    required: boolean
    description: string | null
    config: AdminSettingFieldConfig
    value: Prisma.JsonValue | null
    sort: number
    isBuiltin: boolean
}

export type AdminSettingGroupView = {
    id: number
    key: string
    name: string
    description: string | null
    sort: number
    isBuiltin: boolean
    fields: AdminSettingFieldView[]
}

export type AdminBranding = {
    name: string
    subtitle: string
    icon: string
    favicon: string
}

export type BlogBranding = {
    name: string
    description: string
    logo: string
}

export const DEFAULT_ADMIN_BRANDING: AdminBranding = {
    name: "博客后台",
    subtitle: "BLOG ADMIN",
    icon: "",
    favicon: "",
}

export const DEFAULT_BLOG_BRANDING: BlogBranding = {
    name: GLOBAL_TITLE,
    description: "",
    logo: "/images/logo_transparent.png",
}

const DEFAULT_BRANDING_FIELDS: AdminSettingFieldView[] = [
    {id: -1, key: "name", label: "后台名称", type: "string", required: true, description: null, config: {placeholder: "博客后台"}, value: DEFAULT_ADMIN_BRANDING.name, sort: 0, isBuiltin: true},
    {id: -2, key: "subtitle", label: "后台副标题", type: "string", required: false, description: null, config: {placeholder: "BLOG ADMIN"}, value: DEFAULT_ADMIN_BRANDING.subtitle, sort: 1, isBuiltin: true},
    {id: -3, key: "icon", label: "后台图标", type: "imageUpload", required: false, description: null, config: {}, value: DEFAULT_ADMIN_BRANDING.icon, sort: 2, isBuiltin: true},
    {id: -4, key: "favicon", label: "浏览器标签图标", type: "imageUpload", required: false, description: null, config: {}, value: DEFAULT_ADMIN_BRANDING.favicon, sort: 3, isBuiltin: true},
]

function isRecord(value: Prisma.JsonValue): value is Prisma.JsonObject {
    return value !== null && typeof value === "object" && !Array.isArray(value)
}

function readConfig(config: Prisma.JsonValue): AdminSettingFieldConfig {
    if (!isRecord(config)) return {}
    const parsed = adminSettingConfigSchema.safeParse(config)
    return parsed.success ? parsed.data : {}
}

function normalizeType(type: string): AdminSettingFieldType | null {
    return ADMIN_SETTING_FIELD_TYPES.includes(type as AdminSettingFieldType)
        ? type as AdminSettingFieldType
        : null
}

function isSafeImageSource(value: string): boolean {
    if (value.startsWith("/") && !value.startsWith("//")) return true
    try {
        const url = new URL(value)
        return url.protocol === "http:" || url.protocol === "https:"
    } catch {
        return false
    }
}

function displayFieldValue(groupKey: string, fieldKey: string, value: Prisma.JsonValue | null): Prisma.JsonValue | null {
    if (groupKey === ADMIN_BRANDING_GROUP_KEY && fieldKey === "icon") {
        return typeof value === "string" && isSafeImageSource(value) ? value : null
    }
    return value
}

function fallbackBrandingGroup(): AdminSettingGroupView {
    return {
        id: -1,
        key: ADMIN_BRANDING_GROUP_KEY,
        name: "后台品牌",
        description: "管理后台侧栏品牌信息与浏览器标签图标。",
        sort: 0,
        isBuiltin: true,
        fields: DEFAULT_BRANDING_FIELDS,
    }
}

/** 设置页、侧栏与 metadata 共用请求级快照，避免并行路由重复查库。 */
export const getAdminSettingsSnapshot = cache(async (): Promise<AdminSettingGroupView[]> => {
    try {
        const rows = await prisma.adminSettingGroup.findMany({
            orderBy: [{sort: "asc"}, {id: "asc"}],
            include: {fields: {orderBy: [{sort: "asc"}, {id: "asc"}]}},
        })

        const groups: AdminSettingGroupView[] = rows.map((group) => ({
            id: group.id,
            key: group.key,
            name: group.name,
            description: group.description,
            sort: group.sort,
            isBuiltin: group.isBuiltin,
            fields: group.fields.flatMap((field) => {
                const type = group.key === ADMIN_BRANDING_GROUP_KEY && field.key === "icon"
                    ? "imageUpload"
                    : normalizeType(field.type)
                if (!type) return []
                return [{
                    id: field.id,
                    key: field.key,
                    label: field.label,
                    type,
                    required: group.key === ADMIN_BRANDING_GROUP_KEY && field.key === "icon" ? false : field.required,
                    description: field.description,
                    config: readConfig(field.config),
                    value: displayFieldValue(group.key, field.key, field.value),
                    sort: field.sort,
                    isBuiltin: field.isBuiltin,
                }]
            }),
        }))

        return groups
    } catch {
        // 迁移部署期间仍能进入后台；写操作会清楚提示先应用数据库迁移。
        return [fallbackBrandingGroup()]
    }
})

function stringValue(value: Prisma.JsonValue | null | undefined, fallback: string): string {
    return typeof value === "string" ? value : fallback
}

export const getAdminBranding = cache(async (): Promise<AdminBranding> => {
    let fields = new Map<string, Prisma.JsonValue | null>()
    try {
        const group = await prisma.adminSettingGroup.findUnique({
            where: {key: ADMIN_BRANDING_GROUP_KEY},
            select: {fields: {where: {isBuiltin: true}, select: {key: true, value: true}}},
        })
        fields = new Map(group?.fields.map((field) => [field.key, field.value]) ?? [])
    } catch {
        // 迁移未应用或数据库暂不可用时使用当前后台品牌作为回退。
    }
    return {
        name: stringValue(fields.get("name"), DEFAULT_ADMIN_BRANDING.name),
        subtitle: stringValue(fields.get("subtitle"), DEFAULT_ADMIN_BRANDING.subtitle),
        icon: safeImageValue(fields.get("icon"), DEFAULT_ADMIN_BRANDING.icon),
        favicon: safeImageValue(fields.get("favicon"), DEFAULT_ADMIN_BRANDING.favicon),
    }
})

function safeImageValue(value: Prisma.JsonValue | null | undefined, fallback: string): string {
    const source = stringValue(value, fallback)
    return source && isSafeImageSource(source) ? source : fallback
}

const BLOG_SETTING_LABELS = {
    name: ["博客名称", "博客名", "网站名称", "站点名称"],
    description: ["博客描述", "博客简介", "网站描述", "站点描述"],
    logo: ["博客logo", "博客标志", "网站logo", "站点logo", "logo"],
} as const

const BLOG_SETTING_KEYS = {
    name: ["blogname", "sitename", "websitename", "name", "title"],
    description: ["blogdescription", "sitedescription", "websitedescription", "description"],
    logo: ["bloglogo", "sitelogo", "websitelogo", "logo", "icon"],
} as const

function normalizeSettingIdentifier(value: string): string {
    return value.trim().toLocaleLowerCase().replace(/[\s_-]/g, "")
}

function readBlogField(
    fields: readonly {key: string; label: string; value: Prisma.JsonValue | null}[],
    labels: readonly string[],
    keys: readonly string[],
): Prisma.JsonValue | null {
    const normalizedLabels = new Set(labels.map(normalizeSettingIdentifier))
    const normalizedKeys = new Set(keys.map(normalizeSettingIdentifier))
    return fields.find((field) => normalizedLabels.has(normalizeSettingIdentifier(field.label)))?.value
        ?? fields.find((field) => normalizedKeys.has(normalizeSettingIdentifier(field.key)))?.value
        ?? null
}

function blogText(value: Prisma.JsonValue | null, fallback: string): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback
}

/** 从后台「博客配置」分组读取网站标题、描述与 Logo；按字段标签匹配以兼容自定义字段 key。 */
export const getBlogBranding = cache(async (): Promise<BlogBranding> => {
    try {
        const group = await prisma.adminSettingGroup.findFirst({
            where: {name: "博客配置"},
            select: {fields: {select: {key: true, label: true, value: true}}},
        })
        const fields = group?.fields ?? []
        return {
            name: blogText(readBlogField(fields, BLOG_SETTING_LABELS.name, BLOG_SETTING_KEYS.name), DEFAULT_BLOG_BRANDING.name),
            description: blogText(readBlogField(fields, BLOG_SETTING_LABELS.description, BLOG_SETTING_KEYS.description), DEFAULT_BLOG_BRANDING.description),
            logo: safeImageValue(readBlogField(fields, BLOG_SETTING_LABELS.logo, BLOG_SETTING_KEYS.logo), DEFAULT_BLOG_BRANDING.logo),
        }
    } catch {
        return DEFAULT_BLOG_BRANDING
    }
})

/** 供后续页面读取自定义配置项；该函数只读取配置，不隐式写入数据库。 */
export const getAdminSettingValues = cache(async (groupKey: string): Promise<Record<string, Prisma.JsonValue | null>> => {
    try {
        const group = await prisma.adminSettingGroup.findUnique({
            where: {key: groupKey},
            select: {fields: {orderBy: [{sort: "asc"}, {id: "asc"}], select: {key: true, value: true}}},
        })
        return Object.fromEntries((group?.fields ?? []).map((field) => [field.key, field.value]))
    } catch {
        return {}
    }
})
