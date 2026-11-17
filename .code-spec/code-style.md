# 代码风格规范 | Code Style
> 适用范围: 所有 TypeScript / TSX 源文件 | 最后更新: 2026-11-12
> 权威来源: `prettier.config.js`、`eslint.config.mjs`、`tsconfig.json` + 全仓抽样

## 命名约定

### [CODE-01] 变量命名
- 规则：`camelCase`。布尔变量用 `is/has/can/should` 前缀（`isBuiltin`、`hasAction`、`canAccess`）。
- 示例：`const pendingDelete`、`const hasChildren`、`const isBuiltin`

### [CODE-02] 函数命名
- 规则：动词前缀，按语义选 `get / create / update / delete / handle / build / resolve / require / load / normalize`。
  - 取数用 `getXxx`；写库用 `create/update/deleteXxx`；权限守卫用 `requireXxx`；纯函数用 `build/resolve/normalize`。
  - 异步函数**不加** `Async` 后缀。
- 示例：`getAdminPosts`、`requireAction`、`buildPathIndex`、`normalizePaging`、`resolveScope`

### [CODE-03] 常量命名
- 规则：模块级常量 `UPPER_SNAKE_CASE`；组件内的样式映射表也用 `UPPER_SNAKE_CASE`。
- 示例：`SUCCESS_CODE`、`FAIL_CODE`、`AUTH_FAIL_CODE`、`TONE_STYLE`、`BASE`

### [CODE-04] 文件命名
- 规则：按目录分工，**不要跨目录统一**：
  | 目录 | 约定 | 示例 |
  |---|---|---|
  | 组件 | `PascalCase.tsx` | `PostsTable.tsx`、`MenuFormDialog.tsx` |
  | 路由 | Next 约定小写 | `page.tsx`、`layout.tsx`、`route.ts` |
  | `lib/` | `kebab-case.ts` | `admin-menu-store.ts`、`permission-store.ts` |
  | `service/` | `camelCase.ts` | `postCategory.ts`、`admin.ts` |
  | `hooks/` | `useXxx.ts(x)` | `useAutoFormSubmit.tsx` |
  | `validators/` | `camelCase.ts` | `post.ts`、`role.ts` |
- 测试文件与被测文件同名 + `.test.ts(x)`。

### [CODE-05] 类/接口/类型命名
- 规则：`PascalCase`。**优先 `type` 而非 `interface`**（全仓以 `type` 为主）。
  - 组件 props：`XxxProps`；行数据：`XxxRow`；视图模型：`XxxView`；联合类型直接语义命名（`AdminPage`、`MenuType`）。
- 示例：`type RowActionsProps`、`type AdminMenuRow`、`type RolePermissionView`

### [CODE-06] React 组件命名
- 规则：函数声明式组件，`PascalCase`。**服务端页面组件用 `export default function Page()`**；后台业务组件用**具名导出**。
- 示例：`export function PostsTable(...)`、`export default async function Page()`

## 格式规范

### [CODE-07] 缩进
- 规则：`prettier.config.js` 为 `tabWidth: 2`，但**仓库实际不统一**：
  - `app/(auth)/**`、`app/admin/**`（多数文件）用 **4 空格**
  - 其余（`components/`、`lib/`、`service/`、`app/blog/`）用 **2 空格**
- **硬规则**：新建文件跟随**同目录邻居**的缩进；**禁止对 `app/admin/` 跑 `prettier --write`**，否则整文件重排、diff 爆炸。
- 示例：`app/admin/posts/page.tsx` 是 2 空格（少数），改它时不要顺手改成 4。

### [CODE-08] 引号
- 规则：**双引号** `"`（字符串、import 路径、JSX 属性）。模板字符串用反引号。
- 示例：`import { cn } from "@/lib/utils"`

### [CODE-09] 分号
- 规则：**不写行尾分号**（`prettier.config.js` → `semi: false`）。
- 示例：`const page = Math.max(1, paging.page ?? 1)`（结尾无 `;`）

### [CODE-10] 大括号
- 规则：`if/for/function` 左括号同行；单语句 `if` 也保留大括号（后台代码一致如此）。

### [CODE-11] 行宽
- 规则：`printWidth: 120`。

### [CODE-12] Trailing Comma
- 规则：`trailingComma: "es5"` —— 对象/数组多行末尾加逗号，函数参数末尾**不加**。

## 函数/表达式

### [CODE-13] 箭头函数 vs function
- 规则：**组件与顶层导出用 `function` 声明**；回调、`map/filter`、事件处理器用箭头函数。
- 示例：`export function TableToolbar({...})` vs `rows.map((row) => ...)`

### [CODE-14] async/await vs Promise
- 规则：**一律 `async/await`**，禁止 `.then()` 链。并行请求用 `Promise.all([...])`。
- 示例：`const [result, allowed] = await Promise.all([getMenuListView(), getAllowedKeys(user.roles)])`

### [CODE-15] 解构偏好
- 规则：props、函数参数、`useState` 一律解构；`import { named }` 而非整包导入。
- 示例：`const { can } = usePermission()`

## Import / 导出

### [CODE-16] Import 方式
- 规则：ESM + `@/` 路径别名（`tsconfig.json` → `paths: {"@/*": ["./*"]}`）。相对路径只用于**同目录**或父子目录（`../components/...`）。

### [CODE-17] Import 排序
- 规则：`eslint.config.mjs` 开启 `"sort-imports": ["error", { ignoreCase: true, ignoreDeclarationSort: true }]`。
  - **同一条 import 里的具名成员必须按字母序**（忽略大小写）：`import { buildMenuTree, flattenTree } from ...`
  - 声明之间的顺序不强制（`import/order` 已关闭），惯例是：外部包 → 空行 → `@/` 内部。
- 示例：
  ```ts
  import { NextResponse } from "next/server"

  import { canAccessPage, requiredPageFor } from "@/lib/admin/permissions"
  ```

### [CODE-18] 导出方式
- 规则：页面/布局 `export default`；其余**具名导出**。不做 barrel（`index.ts` 重导出）——例外：`components/k-view/*` 目录自带 `index.ts`。

## TypeScript

### [CODE-19] 类型注解覆盖率
- 规则：`strict: true` + **`noUncheckedIndexedAccess: true`**（数组/字典下标访问结果可能 `undefined`，必须显式处理）。公共函数必须写返回类型或明确的返回结构。
- 示例：`const first = rows[0]` → 类型是 `T | undefined`，用前要判空。

### [CODE-20] any 使用情况
- 规则：`noImplicitAny: false`（历史原因），但**不要主动写 `any`**；用 `unknown` + 收窄，或定义具体类型。外部入参统一 `unknown` 交给 zod 校验。
- 示例：`export async function createMenu(input: unknown)` → `createMenuSchema.parse(input)`

## 注释

### [CODE-21] 注释风格
- 规则：**中文注释**，解释「为什么」而不是「做了什么」。复杂决策用 `/** ... */` 块注释，写清背景与取舍。
- 示例（真实存在）：
  ```ts
  /*
   * 中间件负责登录拦截，页面级权限由服务端守卫校验。
   * 原因：中间件运行在 Edge，权限数据由 Node 服务端读取；未授权用户由页面守卫
   * 跳转到明确的 forbidden 页面，server action 还要单独校验操作权限。
   */
  ```
- 旧文件保留 `koroFileHeader` 文件头（`@Author`/`@Date`/`@Description`），**新文件不必加**。

### [CODE-22] 特殊标记（TODO/FIXME/HACK）
- 规则：允许 `TODO:` / `FIXME:`，后接中文说明与原因；不要留无上下文的裸标记。

## 项目特有约定

### [CODE-23] server action 文件约定
- 规则：`service/*.ts` 顶部第一行必须是 `"use server"`（双引号，无分号）。
- **`"use server"` 文件只能导出 async 函数**；同步工具函数必须抽到 `lib/`（例如 `normalizePaging` 放在 `lib/paging.ts`）。

### [CODE-24] 客户端组件标记
- 规则：需要交互的文件顶部 `"use client"`，放在所有 import 之前。服务端页面（`page.tsx`）不要加。

### [CODE-25] 禁止无脑格式化
- 规则：**不要对 `app/admin/` 跑 `prettier --write`**（缩进与 prettier 配置不一致）。格式化只能由作者针对单文件、且不与本次改动混在同一个 diff 里。

### [CODE-26] 类型导入
- 规则：仅用作类型的导入写 `import type { X } from "..."`，避免把运行时代码带进 bundle（尤其是 Edge 中间件的依赖链）。

### [CODE-27] 空值与可选链
- 规则：可空值用 `?.` + `??`，不要用 `||` 兜底（会吞掉 `0` 和 `""`）。
- 示例：`matrix[code]?.includes(key) ?? false`
