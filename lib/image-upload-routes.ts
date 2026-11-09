/**
 * 上传线路目录：客户端只在这几个固定 id 里选择，
 * 真实上传地址始终由服务端环境变量决定，浏览器无法指定任意 URL。
 *
 * 默认走备用图床的主节点；「现有图床」需要用户在界面上显式选择。
 */
export const UPLOAD_ROUTES = [
  { id: "mtbed-primary", label: "主节点" },
  { id: "mtbed-secondary", label: "备用节点" },
  // { id: "default", label: "现有图床" },
] as const

export type UploadRouteId = (typeof UPLOAD_ROUTES)[number]["id"]

export const DEFAULT_UPLOAD_ROUTE: UploadRouteId = "mtbed-primary"
