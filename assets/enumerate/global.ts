export const STATUS_OPTIONS = [
    {value: 1, label: "正常"},
    {value: 0, label: "禁用"},
] as const

/** 后台菜单节点类型。 */
export const ADMIN_MENU_TYPES = ["dir", "menu", "button"] as const
export type AdminMenuType = (typeof ADMIN_MENU_TYPES)[number]

export const ADMIN_MENU_SURFACES = ["ADMIN", "BLOG"] as const
export type AdminMenuSurface = (typeof ADMIN_MENU_SURFACES)[number]

/** 菜单展示位置；博客主导航和账户头像菜单共用 BLOG 权限范围。 */
export const ADMIN_MENU_POSITIONS = ["ADMIN", "BLOG_NAV", "USER_BRIEF"] as const
export type AdminMenuPosition = (typeof ADMIN_MENU_POSITIONS)[number]

export const ADMIN_MENU_POSITION_OPTIONS = [
    {value: "ADMIN", label: "后台菜单"},
    {value: "BLOG_NAV", label: "博客导航栏"},
    {value: "USER_BRIEF", label: "个人中心菜单"},
] as const

export const ADMIN_MENU_POSITION_SURFACE: Record<AdminMenuPosition, AdminMenuSurface> = {
    ADMIN: "ADMIN",
    BLOG_NAV: "BLOG",
    USER_BRIEF: "BLOG",
}

/** 后台可配置字段控件类型。 */
export const ADMIN_SETTING_FIELD_TYPES = [
    "string",
    "select",
    "number",
    "textarea",
    "uploadFiles",
    "imageUpload",
    "markdown",
    "regionCascader",
    "iconPicker",
    "statusSegment",
] as const
export type AdminSettingFieldType = (typeof ADMIN_SETTING_FIELD_TYPES)[number]

/** 后台主题预设标识。 */
export const ADMIN_PRESET_IDS = ["paper", "neon", "moss", "dusk", "mint", "ink", "sakura", "salt", "brick"] as const
export type AdminPresetId = (typeof ADMIN_PRESET_IDS)[number]

/** 内置后台角色标识。 */
export const BUILTIN_ROLE_CODES = ["superAdmin", "admin", "user"] as const
export type BuiltinRole = (typeof BUILTIN_ROLE_CODES)[number]

/** 后台已知页面权限标识。 */
export const ADMIN_PAGES = [
    "dashboard",
    "posts",
    "postCategories",
    "bookmarks",
    "bookmarkCategories",
    "footprints",
    "users",
    "roles",
    "settings",
    "menus",
] as const
export type AdminPage = (typeof ADMIN_PAGES)[number]

/** 后台内置操作权限标识。 */
export const ADMIN_ACTIONS = [
    "post:create",
    "post:update",
    "post:delete",
    "postCategory:create",
    "postCategory:update",
    "postCategory:delete",
    "bookmark:create",
    "bookmark:update",
    "bookmark:delete",
    "bookmarkCategory:create",
    "bookmarkCategory:update",
    "bookmarkCategory:delete",
    "footprint:create",
    "footprint:update",
    "footprint:delete",
    "user:manage",
    "settings:update",
] as const
export type AdminAction = (typeof ADMIN_ACTIONS)[number]

/** 管理端列表筛选使用的状态与角色类型值。 */
export const ADMIN_STATUS_FILTERS = ["all", "1", "0"] as const
export type AdminStatusFilter = (typeof ADMIN_STATUS_FILTERS)[number]

export const ADMIN_ROLE_FILTERS = ["all", "builtin", "custom"] as const
export type AdminRoleFilter = (typeof ADMIN_ROLE_FILTERS)[number]

/** 后台文章列表的状态标签样式。 */
export const POST_STATUS_TONES = ["live", "draft", "off"] as const
export type PostStatusTone = (typeof POST_STATUS_TONES)[number]

/** 管理端菜单、分类和设置表单共用图标集合。 */
export const ADMIN_ICON_NAMES = [
    "dashboard",
    "posts",
    "bookmarks",
    "footprints",
    "users",
    "settings",
    "book",
    "folder",
    "file",
    "tag",
    "comment",
    "image",
    "link",
    "shield",
    "chart",
    "star",
] as const
export type AdminIconName = (typeof ADMIN_ICON_NAMES)[number]
