/**
 * 角色 / 权限相关入参校验。
 *
 * 只做「形状 + 基本范围」校验；权限 key 的合法性不在这里管 ——
 * key 的合法集合由 lib/admin/permissions.ts 的 PERMISSION_KEY_SET 定义，
 * service 层用集合过滤（未知 key 静默丢弃），这样新增权限项时
 * 不必回头改这个 schema。
 */
import { z } from "zod"
import {fieldConfig} from "@autoform/zod"

/**
 * 权限矩阵保存入参。
 *
 * matrix 是「roleCode → permissionKey[]」的整表覆盖，
 * 所以这里只保证形状，不保证角色是否存在（那要查库，属于 service 的职责）。
 */
export const savePermissionMatrixSchema = z.object({
    matrix: z.record(z.string(), z.array(z.string())),
})

/** 新建角色 */
export const createRoleSchema = z.object({
    code: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{1,31}$/, "角色标识需字母开头，2-32 位字母/数字/下划线"),
    name: z.string().trim().min(1, "请填写显示名称").max(20, "显示名称最多 20 字"),
    description: z.string().trim().max(100).optional(),
    scopeAll: z.boolean().optional(),
    sort: z.number().int().min(0).max(999).optional(),
})

/** 编辑角色（code 不可改，所以不在这个 schema 里） */
export const updateRoleSchema = z.object({
    name: z.string().trim().min(1).max(20).optional(),
    description: z.string().trim().max(100).optional(),
    status: z.union([z.literal(0), z.literal(1)]).optional(),
    scopeAll: z.boolean().optional(),
    sort: z.number().int().min(0).max(999).optional(),
})

/** 角色新增 / 编辑弹窗使用的 autoform schema。 */
export const roleFormSchema = z.object({
    code: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{1,31}$/, "角色标识需字母开头，2-32 位字母/数字/下划线").superRefine(
        fieldConfig({label: "角色标识", fieldType: "roleCode", inputProps: {placeholder: "editor"}}),
    ),
    name: z.string().trim().min(1, "请填写显示名称").max(20, "显示名称最多 20 字").superRefine(
        fieldConfig({label: "显示名称", inputProps: {placeholder: "如 内容编辑", autoComplete: "off"}}),
    ),
    description: z.string().trim().max(100, "描述最多 100 字").superRefine(
        fieldConfig({label: "描述", inputProps: {placeholder: "这个角色负责什么…（最多 100 字）"}}),
    ),
    scopeAll: z.boolean().superRefine(
        fieldConfig({label: "数据范围", fieldType: "roleScope", inputProps: {ariaLabel: "数据范围"}}),
    ),
    status: z.number().int().min(0).max(1).superRefine(
        fieldConfig({label: "状态", fieldType: "roleStatus", inputProps: {ariaLabel: "角色状态"}}),
    ),
})
