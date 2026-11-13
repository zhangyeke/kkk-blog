/**
 * 菜单管理入参校验。
 *
 * 只做「形状 + 跨字段一致性」校验；「父节点是否存在 / 是否成环 / 是否越权」
 * 需要查库，属于 service 层的职责（T03 再补）。
 */
import {z} from "zod"

/** 节点类型：目录 / 菜单 / 按钮 */
export const menuTypeSchema = z.enum(["dir", "menu", "button"])

export type MenuTypeValue = z.infer<typeof menuTypeSchema>

/** 公共字段（新建与编辑共用，避免两处漂移） */
const menuFields = {
    /** 父节点 id；null / 省略 = 一级节点 */
    parentId: z.number().int().positive().nullable().optional(),
    name: z.string().trim().min(1, "请填写菜单名称").max(20, "最多 20 字"),
    type: menuTypeSchema,
    icon: z.string().trim().max(40).nullable().optional(),
    path: z.string().trim().max(120).nullable().optional(),
    component: z.string().trim().max(160).nullable().optional(),
    componentName: z.string().trim().max(60).nullable().optional(),
    /** page:<AdminPage> | action:<AdminAction>；目录必须为空 */
    permissionKey: z.string().trim().max(80).nullable().optional(),
    sort: z.number().int().min(0).max(999).default(0),
    status: z.union([z.literal(0), z.literal(1)]).default(1),
    visible: z.boolean().default(true),
    alwaysShow: z.boolean().default(false),
    keepAlive: z.boolean().default(false),
}

/**
 * 跨字段校验。
 *
 * - `dir`：必须无 permissionKey（纯分组）；
 * - `menu`：必须有 path，且 permissionKey 以 `page:` 开头；
 * - `button`：必须有 permissionKey，且以 `action:` 开头。
 *
 * `mode === "create"` 时字段必须齐全；`"update"` 是部分更新，
 * 只校验「本次传了的字段」——没传的字段由 service 读库拿原值后自行判断，
 * 否则「只改个名字」也会被要求同时提交 type/path/permissionKey。
 */
function validateMenuShape(
    value: {
        type?: MenuTypeValue | undefined
        path?: string | null | undefined
        permissionKey?: string | null | undefined
    },
    ctx: z.RefinementCtx,
    mode: "create" | "update",
): void {
    const type = value.type
    // update 没改 type：跨字段规则依赖原 type，这里无从判断，交给 service
    if (!type) return

    const requireAll = mode === "create"
    const pathProvided = value.path !== undefined
    const keyProvided = value.permissionKey !== undefined
    const path = value.path ?? null
    const permissionKey = value.permissionKey ?? null

    const addIssue = (field: "path" | "permissionKey", message: string): void => {
        ctx.addIssue({code: z.ZodIssueCode.custom, path: [field], message})
    }

    if (type === "dir") {
        if (permissionKey) addIssue("permissionKey", "目录是纯分组，不能设置权限标识")
        return
    }

    if (type === "menu") {
        if ((requireAll || pathProvided) && !path) addIssue("path", "菜单必须填写路由路径")
        if ((requireAll || keyProvided) && !permissionKey) {
            addIssue("permissionKey", "菜单必须填写权限标识")
        } else if (permissionKey && !permissionKey.startsWith("page:")) {
            addIssue("permissionKey", "菜单权限标识必须以 page: 开头")
        }
        return
    }

    // button
    if ((requireAll || keyProvided) && !permissionKey) {
        addIssue("permissionKey", "按钮必须填写权限标识")
    } else if (permissionKey && !permissionKey.startsWith("action:")) {
        addIssue("permissionKey", "按钮权限标识必须以 action: 开头")
    }
}

/** 新建菜单 */
export const createMenuSchema = z.object(menuFields).superRefine((value, ctx) => {
    validateMenuShape(value, ctx, "create")
})

/**
 * 编辑菜单（部分更新）。
 *
 * 说明：类型上是 `z.object(menuFields).partial().extend({id})` 的等价物。
 * 这里没有直接写 `createMenuSchema.partial()` —— `.superRefine` 之后得到的是
 * ZodEffects，没有 `.partial()` 方法，只能从字段定义重新组装。
 */
export const updateMenuSchema = z
    .object(menuFields)
    .partial()
    .extend({id: z.number().int().positive()})
    .superRefine((value, ctx) => {
        validateMenuShape(value, ctx, "update")
    })

/** 移动节点（只改 parentId，用于拖拽排序 / 换父级） */
export const moveMenuSchema = z.object({
    id: z.number().int().positive(),
    parentId: z.number().int().positive().nullable(),
})

export type CreateMenuInput = z.infer<typeof createMenuSchema>
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>
export type MoveMenuInput = z.infer<typeof moveMenuSchema>
