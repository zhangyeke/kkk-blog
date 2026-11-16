# SQL / 数据库规范 | SQL & Database
> 适用范围: `prisma/**`、`service/**` | 最后更新: 2026-11-12
> 权威来源: `prisma/schema.prisma`、`prisma/manual-sql/*.sql`、`lib/prisma.ts`

## 迁移流程（最高优先级）

### [SQL-01] 禁止使用 prisma 自动迁移
- 规则：**严禁 `prisma db push`、`prisma migrate dev`**。
- 原因：线上库与 `schema.prisma` 存在**真实漂移**，push 会按 schema 反推并可能删改数据。
- 唯一合法路径：
  1. 手写幂等 SQL → `prisma/manual-sql/NNN_描述.sql`
  2. 停 dev server
  3. `npx prisma db execute --file <sql> --schema prisma/schema.prisma`
  4. 改 `schema.prisma` → `npx prisma generate`
  5. 重启 dev server

### [SQL-02] Windows 上的 generate 顺序
- 规则：**必须先停 dev server 再 `prisma generate`**，否则 query_engine DLL 被占用报 `EPERM`。

### [SQL-03] 迁移文件命名与幂等
- 规则：`NNN_动词_对象.sql`（`004_create_admin_menu.sql`、`005_seed_admin_menu.sql`）。
- 建表必须 `CREATE TABLE IF NOT EXISTS`；索引 `CREATE INDEX IF NOT EXISTS`；种子 `ON CONFLICT DO NOTHING`。
- Postgres 不支持 `ADD CONSTRAINT IF NOT EXISTS`，用 `DO $$ ... pg_constraint ... $$` 包裹。
- **每个迁移脚本必须能连续执行两次不报错**。

### [SQL-04] 显式 id 的种子要校正序列
```sql
INSERT INTO "public"."AdminMenu" ("id", ...) VALUES (...) ON CONFLICT ("id") DO NOTHING;
SELECT setval(pg_get_serial_sequence('"public"."AdminMenu"', 'id'),
              GREATEST((SELECT MAX("id") FROM "public"."AdminMenu"), 1));
```
- 漏掉 `setval` 会导致后续 `create` 撞主键。

## 模型与命名

### [SQL-05] 模型命名
- 规则：Prisma `model` 用 **PascalCase 单数**（`Post`、`AdminMenu`、`RolePermission`）；对应表名保持同名（不加 `@@map` 前缀）。
- 字段用 **camelCase**（`createdAt`、`permissionKey`），不写下划线。

### [SQL-06] 时间字段
- 规则：统一 `DateTime @default(now()) @db.Timestamp(6)`；更新时间加 `@updatedAt`。**不要用 `Date` 类型**。

### [SQL-07] 主键
- 规则：自增 `Int @id @default(autoincrement())`；用户类实体用 `String @db.Uuid @default(dbgenerated("gen_random_uuid()"))`。

### [SQL-08] 索引命名
- 规则：唯一约束显式命名 `map: "表名_字段_key"`（`Role_code_key`）；普通索引用 Prisma `@@index([字段])` 默认命名。

### [SQL-09] 关联与级联
- 规则：从属关系用 `onDelete: Cascade`（`Post.user`、`RolePermission.role`、`AdminMenu.parent`）。自引用树用命名关系 `@relation("AdminMenuTree")` + `Cascade`。
- **逻辑引用不建外键**：`RolePermission.permissionKey → AdminMenu.permissionKey` 故意不建 FK，避免删菜单与删授权互相卡死；由 service 层事务清理。

## 查询

### [SQL-10] 查询入口
- 规则：所有查询在 `service/*.ts`；`lib/*-store.ts` 只做缓存包装。**组件与页面不得直接 import `prisma`**。

### [SQL-11] 字段裁剪
- 规则：列表查询用 `select` 显式列出字段，**不要 `include` 整表**；正文类大字段（`content`）只在详情查询取。

### [SQL-12] 计数
- 规则：关联计数用 `_count: { select: { posts: true } }`；跨表统计用 `groupBy`，避免 N+1。

### [SQL-13] 分页
- 规则：`skip: (page - 1) * pageSize` + `take: pageSize`，配合 `count` 求 `totalPages`。参数统一经 `normalizePaging()`。

### [SQL-14] 软删除
- 规则：**未使用软删除**。删除即物理删除，靠 `status` 字段表达「下架/禁用」而非删除。

### [SQL-15] 事务
- 规则：涉及多表一致性必须 `$transaction`。删除父节点前先收集子节点 `permissionKey`，再删授权、最后删节点。

## 项目特有约定

### [SQL-16] 状态字段约定
- 规则：`status Int @default(1)`，`0 = 停用/禁用`，`1 = 正常`。不用布尔（`BookmarkCategory`、`PostCategory`、`Role`、`AdminMenu` 一致）。
- 布尔只用于真正的二值语义（`isBuiltin`、`visible`、`scopeAll`）。

### [SQL-17] 种子与代码常量必须同源
- 规则：`prisma/manual-sql/005_seed_admin_menu.sql` 与 `lib/admin-menu-seed.ts` 的 `ADMIN_MENU_SEED` **必须逐字段一致**（32 行）。改一处必须同步另一处，并跑深比较校验。
- 原因：前者是 DB 真相，后者是 Edge 降级兜底；不一致会导致中间件与页面层判断分歧。

### [SQL-18] 权限数据不冗余
- 规则：`superAdmin` 在 `RolePermission` 里**不存任何行**，权限由 `hasPermission()` 硬短路。新增角色时不要给 superAdmin 补授权。

### [SQL-19] 迁移后自检
- 规则：每次迁移后跑四条校验：
  ```sql
  SELECT count(*) FROM "AdminMenu";                                   -- 期望 32
  SELECT DISTINCT rp."permissionKey" FROM "RolePermission" rp
    LEFT JOIN "AdminMenu" m ON m."permissionKey" = rp."permissionKey"
    WHERE m."id" IS NULL;                                             -- 期望 0 行
  SELECT c."id" FROM "AdminMenu" c LEFT JOIN "AdminMenu" p ON p."id" = c."parentId"
    WHERE c."parentId" IS NOT NULL AND p."id" IS NULL;                -- 期望 0 行（树完整）
  ```
