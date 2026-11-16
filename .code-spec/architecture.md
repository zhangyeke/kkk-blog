# 架构规范 | Architecture
> 适用范围: 全仓 | 最后更新: 2026-11-12
> 权威来源: 目录结构、`next.config.ts`、`proxy.ts`、`app/admin/layout.tsx`、`lib/*`、`service/*`

## 目录与分层

### [ARCH-01] 项目目录布局
```
app/            路由与页面（Next App Router）
  admin/        后台（并行路由 @sidebar / @topbar + 内容）
  blog/         博客前台
  api/          仅少量 route handler（非 CRUD 主通道）
components/
  ui/           shadcn 通用组件（Radix 底座）
  k-view/       项目自有业务组件（DataTable/FilterForm/Form/Popup…）
  admin/        后台专属组件（权限上下文等）
service/        数据访问 + server actions（"use server"）
lib/            纯函数、基础设施、跨端安全模块（无 React）
validators/     zod schema
types/          TS 类型
store/          zustand 全局状态
hooks/          自定义 hooks
prisma/         schema + manual-sql
styles/         全局样式（admin-theme.css）
```

### [ARCH-02] 模块划分原则
- 规则：按**技术职责**分层（service / lib / components），不按业务域分包。业务域通过文件名前缀区分（`postCategory.ts`、`role.ts`、`menu.ts`）。

### [ARCH-03] 分层结构
| 层 | 位置 | 职责 | 约束 |
|---|---|---|---|
| 路由层 | `app/**/page.tsx`、`layout.tsx` | 取数 + 权限守卫 + 组装 | 默认服务端组件，不写业务逻辑 |
| 服务层 | `service/*.ts` | 数据访问 + 写操作（server action） | 文件头 `"use server"`，只能导出 async 函数 |
| 领域层 | `lib/*.ts` | 纯函数、规则计算 | 无 React、无 IO（`*-store.ts` 例外） |
| 表现层 | `components/**` | UI 与交互 | 不直接查库 |

### [ARCH-04] 层间依赖规则
- 规则：`app → service/lib/components`；`service → lib + prisma`；`lib → lib`（纯）。
- **禁止** `lib` 反向 import `service`；**禁止** `components` 直接 import `prisma`。
- Edge 安全的模块（`proxy.ts` 依赖链）**不得** import 带 `server-only` 或 Prisma 的模块。

### [ARCH-05] 依赖注入
- 规则：不使用 DI 容器。跨层依赖通过函数参数传入（如 `scope`、`can`、`roles`），便于测试与复用。

### [ARCH-06] 包管理器
- 规则：**pnpm**（`pnpm-lock.yaml`）。安装用 `pnpm add`，不要混用 npm/yarn。

## 状态与路由

### [ARCH-07] 状态管理
- 规则：**zustand**（`store/`），配合 `immer` + `devtools` + `persist`（localStorage）。仅存**跨页面的客户端状态**（用户偏好、系统设置）。

### [ARCH-08] 全局 vs 局部状态
- 规则：能用服务端数据解决的不用全局状态。列表筛选条件放 **URL query**（`FilterForm` 以 URL 为唯一数据源），弹窗开关放组件 `useState`。

### [ARCH-09] 路由方案
- 规则：Next.js App Router 文件路由。后台用**并行路由** `@sidebar` / `@topbar` 注入布局插槽，`app/admin/layout.tsx` 负责外壳与权限上下文。

### [ARCH-10] 路由组织
- 规则：后台路由与菜单表 `AdminMenu.path` 一一对应；新增后台页面必须同步在 `prisma/manual-sql/005_seed_admin_menu.sql` 与 `lib/admin-menu-seed.ts` 各加一行（两处必须逐字段一致）。

## 工程化

### [ARCH-11] 构建工具
- 规则：Next.js 16 + webpack（`next dev --webpack`），`NODE_OPTIONS=--max-old-space-size=4096`。

### [ARCH-12] TypeScript 严格模式
- 规则：`strict: true` + `noUncheckedIndexedAccess: true`；`noImplicitAny: false`（历史遗留，勿主动写 `any`）。

### [ARCH-13] 代码格式化
- 规则：ESLint（`eslint.config.mjs`）+ Prettier。**`sort-imports` 是 error**（具名成员需字母序）；`@typescript-eslint/no-unused-vars` 为 warn 且允许 `_` 前缀。
- **不要对 `app/admin/` 跑 `prettier --write`**（缩进与配置不一致）。

### [ARCH-14] 测试框架
- 规则：Jest + Testing Library（单测）、Playwright（E2E）。`proxy.test.ts` 是中间件回归的关键测试，改动 `proxy.ts` 必须同步更新。
- 提交前至少跑：`node node_modules/typescript/bin/tsc --noEmit`、`pnpm test`。

### [ARCH-15] 环境变量
- 规则：`env.mjs`（`@t3-oss/env-nextjs` 风格）做校验；`DATABASE_URL` 在 `.env`。**不要把密钥写进代码或提交到 git**。

### [ARCH-16] Monorepo
- 规则：无。单仓库单应用。

### [ARCH-17] CI/CD
- 规则：未配置 CI 流水线，靠本地 `tsc` + `jest` + `lint` 把关。

### [ARCH-18] 容器化
- 规则：无 Docker 配置。

### [ARCH-19] 国际化
- 规则：前台 `i18next`；后台中文硬编码。

### [ARCH-20] 全局错误处理
- 规则：`app/error.tsx` / `not-found.tsx` 兜底；server action 内部 `try/catch` 转成 `backFailMessage`，**不要抛出裸 Error 给前端**。

### [ARCH-21] 业务错误处理
- 规则：统一 `BaseResource`：`{ code, message, data }`。成功 `code=200`，失败 `code=0`，鉴权失败 `code=401`。
  - 读操作失败返回**带默认值**的 `backFailMessage(msg, defaultValue)`，保证 UI 不崩。
  - 写操作失败返回 `backFailMessage(msg)`，前端 `toast.error`。

### [ARCH-22] 日志
- 规则：开发期用 `console`；无集中日志系统。

## 项目特有约定

### [ARCH-23] 后台权限三层
- 规则：权限必须三层同时成立，缺一不可：
  1. **登录拦截** — `proxy.ts`（Edge，未登录返回 307）；**页面授权** — `lib/admin-guard.ts` 的 `requirePageAccess`
  2. **按钮级** — `requireAction` / `<Can action="...">` / `usePermission().can()`
  3. **数据级** — `scopeOf(user)` 决定查全量还是只看自己
- **只做前两层而不做数据级过滤，等于越权可查。**

### [ARCH-24] 权限数据模型
- 规则：`Role`（角色）→ `RolePermission`（roleCode + permissionKey）→ `AdminMenu`（菜单树，permissionKey 唯一来源）。
  - `superAdmin` **硬短路**：`hasPermission` 直接返回 true，DB 里不存它的授权行。
  - `permissionKey` 命名：页面 `page:<slug>`，按钮 `action:<resource>:<verb>`。

### [ARCH-25] 中间件与权限
- 规则：`proxy.ts` 只检查登录态，不读取权限快照；页面访问与服务端操作由 `lib/admin-guard.ts` 授权。
- 菜单和权限读取优先使用数据库；读取失败或菜单/授权数据为空时，后台导航和守卫使用 `ADMIN_MENU_SEED` 与 `DEFAULT_PERMISSION_MATRIX`。

### [ARCH-26] 缓存策略
- 规则：
  | 场景 | 方案 | 原因 |
  |---|---|---|
  | RSC 读权限/菜单 | `React.cache()` | 请求级去重，**无 TTL**，改完刷新立即生效 |
- 菜单/授权写操作调用 `revalidatePath("/admin", "layout")`；React.cache 不跨请求，不需要额外清理。

### [ARCH-27] 数据库变更流程（重要）
- 规则：**严禁 `prisma db push` / `prisma migrate dev`**（库与 schema 有真实漂移）。
  1. 手写幂等 SQL 放 `prisma/manual-sql/NNN_描述.sql`
  2. **先停 dev server**（Windows 上 query_engine DLL 被锁）
  3. `npx prisma db execute --file <sql> --schema prisma/schema.prisma`
  4. 改 `schema.prisma` → `npx prisma generate`
  5. 重启 dev server
- 显式 id 的种子 SQL 必须带 `setval` 校正序列。

### [ARCH-28] 列表页标准结构
- 规则：`FilterForm`（URL 驱动）→ `TableToolbar`（主操作）→ `DataTable`（`footer` 放分页）→ 弹窗。
- 页面根 `flex h-full min-h-0 flex-col`，**页面不出现滚动条**，滚动只发生在表格区。
