# 规范索引 | Code Spec Index
> 项目: `kkk-blog`（Next.js 16 + React 19 + Tailwind v4 + Prisma/PostgreSQL）
> 模块清单，按需加载对应文件。首次生成: 2026-11-12

## 模块清单

| 模块 | 文件 | 摘要 | 条目数 | 最后更新 |
|------|------|------|--------|---------|
| 代码风格 | `code-style.md` | 命名/缩进/引号/分号/import排序/TS/注释 + 项目特有约定 | 27 | 2026-11-12 |
| UI 风格 | `ui-style.md` | 后台 `--adm-*` 令牌/字体/间距/布局/组件库/表单/弹窗/动画 + 禁用蓝色 | 40 | 2026-11-12 |
| 架构规范 | `architecture.md` | 分层/依赖/状态/路由/测试/错误处理 + 权限三层 + 缓存策略 + 迁移流程 | 28 | 2026-11-12 |
| API 设计 | `api-spec.md` | server action 优先/BaseResource/错误码/鉴权/失效/事务 | 22 | 2026-11-12 |
| SQL/数据库 | `sql-spec.md` | 禁 db push/手写幂等 SQL/模型命名/索引/事务/种子同源 | 19 | 2026-11-12 |
| Git 规范 | `git-spec.md` | Conventional Commits 中文描述/type 白名单/提交粒度/Tag | 12 | 2026-11-12 |

合计 **148 条**规范。

## 使用方法

0. **检测 `.code-spec/` 是否存在** → 存在则继续
1. 按任务关键词匹配上表模块（**最多加载 3 个**）
2. 读取对应模块文件
3. 在代码生成/修改/修复/Review 中应用
4. 对话结束前检查是否有新规范需要增量更新

## 路由速查

| 任务 | 加载模块 |
|---|---|
| 写组件/页面/样式 | `ui-style.md` + `code-style.md` |
| 写接口 / server action | `api-spec.md` + `code-style.md` |
| 改数据库 / 迁移 | `sql-spec.md` + `architecture.md` |
| 重构 / 修 bug | 按目标文件类型，≤2 个 |
| 提交 / 发版 | `git-spec.md` |
| 新增后台页面 | `architecture.md` + `ui-style.md` + `sql-spec.md`（菜单表要同步） |

## 三条最容易踩的红线

1. **禁止对 `app/admin/` 跑 `prettier --write`** —— 该目录是 4 空格，prettier 配置是 2 空格，一跑整文件重排。（`code-style.md` CODE-07 / CODE-25）
2. **禁止 `prisma db push` / `migrate dev`** —— 库与 schema 有真实漂移，只能手写 `prisma/manual-sql/*.sql`。（`sql-spec.md` SQL-01）
3. **中间件不能查库** —— `proxy.ts` 跑 Edge，权限只能走快照接口；降级必须与页面层同源，否则「中间件放行、页面层 403」。（`architecture.md` ARCH-25）

## 语言特有规范

本项目检测语言为 `node`（含 TypeScript）。通用 `code-style.md` 已覆盖 TS 部分，**未单独生成 `node-style.md`**（Node 服务端约定已并入 `architecture.md` 与 `api-spec.md`）。

## 外部文件

| 文件 | 说明 |
|------|------|
| `project_context.json` | 语言/框架检测结果 + 关键配置快照 |
| `_meta.json` | 模块版本、条目数、内容哈希 |
