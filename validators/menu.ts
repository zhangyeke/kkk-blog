/**
 * 菜单管理入参校验。
 *
 * 只做「形状 + 跨字段一致性」校验；「父节点是否存在 / 是否成环 / 是否越权」
 * 需要查库，属于 service 层的职责（T03 再补）。
 */
import { z } from "zod"
import { fieldConfig } from "@autoform/zod"
import {
  ADMIN_ICON_NAMES,
  ADMIN_MENU_POSITION_OPTIONS,
  ADMIN_MENU_POSITION_SURFACE,
  ADMIN_MENU_POSITIONS,
  ADMIN_MENU_SURFACES,
  ADMIN_MENU_TYPES,
} from "@/assets/enumerate/global"

/** 节点类型：目录 / 菜单 / 按钮 */
export const menuTypeSchema = z.enum(ADMIN_MENU_TYPES)

export type MenuTypeValue = z.infer<typeof menuTypeSchema>

/** 公共字段（新建与编辑共用，避免两处漂移） */
const menuFields = {
  surface: z.enum(ADMIN_MENU_SURFACES).optional(),
  position: z.enum(ADMIN_MENU_POSITIONS).default("ADMIN").superRefine(
    fieldConfig({
      label: "菜单位置",
      fieldType: "select",
      inputProps: {
        options: ADMIN_MENU_POSITION_OPTIONS,
        className: "admin-dialog-input",
        style: { borderColor: "var(--adm-line)", color: "var(--adm-ink)", background: "var(--adm-paper-2)" },
      },
    })
  ),
  /** 父节点 id；null / 省略 = 一级节点 */
  parentId: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .superRefine(
      fieldConfig({
        label: "上级菜单",
        fieldType: "menuParent",
        inputProps: {
          placeholder: "顶级菜单",
          className: "admin-dialog-input",
          style: { borderColor: "var(--adm-line)", color: "var(--adm-ink)", background: "var(--adm-paper-2)" },
        },
      })
    ),
  name: z
    .string()
    .trim()
    .min(1, "请填写菜单名称")
    .max(20, "最多 20 字")
    .superRefine(
      fieldConfig({
        label: "菜单名称",
        inputProps: { placeholder: "如 文章管理", autoComplete: "off", className: "admin-dialog-input" },
      })
    ),
  type: menuTypeSchema.superRefine(
    fieldConfig({
      label: "菜单类型",
      fieldType: "menuType",
      inputProps: {
        ariaLabel: "菜单类型",
        options: [
          { value: "dir", label: "目录" },
          { value: "menu", label: "菜单" },
          { value: "button", label: "按钮" },
        ],
      },
    })
  ),
  icon: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .optional()
    .superRefine(
      fieldConfig({
        label: "菜单图标",
        fieldType: "iconPicker",
        inputProps: {
          options: ADMIN_ICON_NAMES,
          placeholder: "图标名，如 posts",
          ariaLabel: "选择菜单图标",
          emptyLabel: "无图标",
          columns: 6,
        },
      })
    ),
  path: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .superRefine(
      fieldConfig({
        label: "路由地址",
        inputProps: { placeholder: "如 /admin/posts", autoComplete: "off", className: "admin-dialog-input" },
      })
    ),
  component: z
    .string()
    .trim()
    .max(160)
    .nullable()
    .optional()
    .superRefine(
      fieldConfig({
        label: "组件地址",
        inputProps: {
          placeholder: "app/admin/posts/page.tsx",
          autoComplete: "off",
          className: "admin-dialog-input font-mono",
        },
      })
    ),
  componentName: z
    .string()
    .trim()
    .max(60)
    .nullable()
    .optional()
    .superRefine(
      fieldConfig({
        label: "组件名字",
        inputProps: { placeholder: "posts", autoComplete: "off", className: "admin-dialog-input font-mono" },
      })
    ),
  /** page:<AdminPage> | action:<AdminAction>；目录必须为空 */
  permissionKey: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .optional()
    .superRefine(
      fieldConfig({
        label: "权限标识",
        inputProps: { placeholder: "page:posts", autoComplete: "off", className: "admin-dialog-input font-mono" },
      })
    ),
  sort: z
    .number()
    .int()
    .min(0)
    .max(999)
    .default(0)
    .superRefine(
      fieldConfig({ label: "显示排序", inputProps: { min: 0, max: 999, step: 1, className: "admin-dialog-input" } })
    ),
  status: z
    .union([z.literal(0), z.literal(1)])
    .default(1)
    .superRefine(
      fieldConfig({
        label: "菜单状态",
        fieldType: "statusSegment",
        inputProps: {
          ariaLabel: "菜单状态",
          options: [
            { value: 1, label: "开启" },
            { value: 0, label: "关闭" },
          ],
          testIdPrefix: "menu-status",
        },
      })
    ),
  visible: z
    .boolean()
    .default(true)
    .superRefine(
      fieldConfig({
        label: "显示状态",
        fieldType: "booleanSegment",
        inputProps: {
          ariaLabel: "显示状态",
          options: [
            { value: true, label: "显示" },
            { value: false, label: "隐藏" },
          ],
          testIdPrefix: "menu-visible",
        },
      })
    ),
  alwaysShow: z
    .boolean()
    .default(false)
    .superRefine(
      fieldConfig({
        label: "总是显示",
        fieldType: "booleanSegment",
        inputProps: {
          ariaLabel: "总是显示",
          options: [
            { value: true, label: "总是" },
            { value: false, label: "不是" },
          ],
          testIdPrefix: "menu-always-show",
        },
      })
    ),
  keepAlive: z
    .boolean()
    .default(false)
    .superRefine(
      fieldConfig({
        label: "缓存状态",
        fieldType: "booleanSegment",
        inputProps: {
          ariaLabel: "缓存状态",
          options: [
            { value: true, label: "缓存" },
            { value: false, label: "不缓存" },
          ],
          testIdPrefix: "menu-keep-alive",
        },
      })
    ),
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
    surface?: "ADMIN" | "BLOG" | undefined
    position?: "ADMIN" | "BLOG_NAV" | "USER_BRIEF" | undefined
    path?: string | null | undefined
    permissionKey?: string | null | undefined
  },
  ctx: z.RefinementCtx,
  mode: "create" | "update"
): void {
  const type = value.type
  // update 没改 type：跨字段规则依赖原 type，这里无从判断，交给 service
  if (!type) return

  const requireAll = mode === "create"
  const pathProvided = value.path !== undefined
  const keyProvided = value.permissionKey !== undefined
  const path = value.path ?? null
  const permissionKey = value.permissionKey ?? null
  const surface = value.position
    ? ADMIN_MENU_POSITION_SURFACE[value.position]
    : value.surface ?? "ADMIN"

  const addIssue = (field: "path" | "permissionKey", message: string): void => {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message })
  }

  if (value.position && value.surface && ADMIN_MENU_POSITION_SURFACE[value.position] !== value.surface) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["position"], message: "菜单位置与权限范围不匹配" })
  }

  if (surface === "BLOG" && path && (!path.startsWith("/") || path.startsWith("//"))) {
    addIssue("path", "博客菜单只允许站内路径")
  }

  if (type === "dir") {
    if ((requireAll || pathProvided) && !path) addIssue("path", "目录必须填写路由地址")
    if (permissionKey) addIssue("permissionKey", "目录是纯分组，不能设置权限标识")
    return
  }

  if (type === "menu") {
    if ((requireAll || pathProvided) && !path) addIssue("path", "菜单必须填写路由路径")
    if ((requireAll || keyProvided) && !permissionKey) {
      addIssue("permissionKey", "菜单必须填写权限标识")
    } else if (permissionKey && surface === "BLOG" && !permissionKey.startsWith("blog:")) {
      addIssue("permissionKey", "博客菜单权限标识必须以 blog: 开头")
    } else if (permissionKey && surface === "ADMIN" && !permissionKey.startsWith("page:")) {
      addIssue("permissionKey", "菜单权限标识必须以 page: 开头")
    }
    return
  }

  // button
  if (surface === "BLOG") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["type"], message: "博客菜单只支持目录和链接" })
    return
  }
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
  .extend({ id: z.number().int().positive() })
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
