# API 设计规范 | API Spec
> 适用范围: `service/*.ts`（server actions）、`app/api/**/route.ts` | 最后更新: 2026-11-12
> 权威来源: `lib/actionMessageBack.ts`、`service/admin.ts`、`lib/admin-guard.ts`

## 总则

### [API-01] 接口形态：server action 为主
- 规则：**后台所有业务读写走 server action**（`service/*.ts`，文件头 `"use server"`），不新建 CRUD REST 路由。
- `app/api/` 只放第三方回调等确实需要 HTTP route 的接口；后台业务读写走 server action。
- 理由：与现有 5 个 service 保持一致，表单提交与 `revalidatePath` 都是现成套路。

### [API-02] server action 函数签名
- 规则：入参用**单个对象**，类型 `unknown` 交由 zod 校验；返回统一 `BaseResource<T>`。
- 示例：
  ```ts
  export async function createMenu(input: unknown): Promise<BaseResource<{ id: number }>> {
      const user = await requireAction("menu:create")
      const data = createMenuSchema.parse(input)
      ...
      return backSuccessMessage("已创建", { id: menu.id })
  }
  ```

### [API-03] 命名
- 规则：`getXxx`（读）、`createXxx` / `updateXxx` / `deleteXxx`（写）、`toggleXxx`（状态切换）、`saveXxx`（整表覆盖）。后台专用读函数加 `Admin` 前缀区分（`getAdminPosts`）。

### [API-04] 鉴权
- 规则：每个写 action 第一行必须做权限校验，且**校验在取数之前**：
  | 场景 | 用法 |
  |---|---|
  | 页面级 | `requirePageAccess("posts")` 或 `requirePageAccess("page:posts")`（两者等价） |
  | 按钮级 | `requireAction("post:delete")` 或 `requireAction("action:post:delete")` |
  | 数据范围 | `const scope = scopeOf(user)`，`scope.all === false` 时追加 `userId` 过滤 |
- 无权限时 `requireAction` 抛 `ActionError`，由调用方 `catch` 转 `backFailMessage`。

### [API-05] 参数校验
- 规则：zod schema 放 `validators/`，命名 `xxxSchema`；跨字段规则用 `.superRefine()`。
- 前端 `components/k-view/Form` 用同一份 schema 渲染字段，**前后端共用一份**。

## 请求与响应

### [API-06] 分页参数
- 规则：`page`（≥1，默认 1）、`pageSize`（1–100，默认 10），统一用 `lib/paging.ts` 的 `normalizePaging()`。返回 `{ list, total, page, pageSize, totalPages }`。

### [API-07] 筛选参数
- 规则：筛选条件放 URL query，由 `FilterForm` 提交 `router.push`；服务端从 `searchParams` 读取。空值统一视为「不过滤」。

### [API-08] 文件上传
- 规则：走 `hooks/use-image-upload` + `service/fileUpload.ts`；超大图片返回 `413`（`backImagePayloadLargeMessage`）。

### [API-09] 成功响应结构
```ts
type BaseResource<T> = { code: number; message: string; data: T }
// 成功
backSuccessMessage("已删除", data?)  // → { code: 200, message, data }
```

### [API-10] 错误响应结构
```ts
backFailMessage("分类名称已存在")     // → { code: 0, message, data: null }
backAuthFailMessage("请先登录")       // → { code: 401, ... }
backImagePayloadLargeMessage("图片过大") // → { code: 413, ... }
```

### [API-11] HTTP 状态码
- 规则：server action 恒为 200，**业务状态放在 `code` 字段**。只有 `route.ts` 用真实 HTTP 码（401 未登录、404、500）。

### [API-12] 业务错误码
| code | 含义 |
|---|---|
| `200` | 成功 |
| `0` | 业务失败（校验不通过、无权限的业务提示） |
| `401` | 未登录 / 鉴权失败 |
| `413` | 上传负载过大 |

### [API-13] 错误消息
- 规则：**中文、可操作、不含堆栈**。格式优先「原因 + 下一步」。
- 示例：`该分类下还有 12 篇文章，请先迁移或删除`、`权限标识已被使用`、`同级下已存在「概览」，请换一个名称`

## 工程化

### [API-14] 文件组织
- 规则：一个业务域一个文件（`service/menu.ts`、`service/role.ts`）。超过 ~500 行再按子域拆。

### [API-15] 版本策略
- 规则：无版本号。破坏性改动直接改，前后端同仓同步发布。

### [API-16] 接口文档
- 规则：无 Swagger。**类型签名 + 文件头注释即文档**，导出类型（如 `MenuListView`）供前端引用。

### [API-17] Base URL
- 规则：server action 无 URL；`route.ts` 内部调用用 `request.nextUrl.origin`。

### [API-18] 超时与重试
- 规则：服务端内部 fetch 必须设超时并明确失败处理；鉴权守卫不通过 HTTP 自调用读取权限。

## 项目特有约定

### [API-19] 写后失效
- 规则：每个写 action 成功后必须显式失效：
  ```ts
  revalidatePath("/admin/posts")          // 当前列表
  revalidatePath("/admin", "layout")      // 涉及菜单/权限时，刷新后台外壳
  ```

### [API-20] 事务
- 规则：多表写入必须 `prisma.$transaction([...])` 或交互式事务。典型场景：删菜单要同时删子树与授权行；改 `permissionKey` 要迁移授权行。

### [API-21] 登录与页面授权
- 规则：`proxy.ts` 只负责登录拦截；后台页面与 server action 的权限由 `lib/admin-guard.ts` 校验。

### [API-22] 客户端调用约定
- 规则：客户端组件直接 `await someAction(...)`；失败统一 `toast.error(result.message)`，**禁止 `window.alert`**；成功后 `router.refresh()`（不手动改本地列表）。
