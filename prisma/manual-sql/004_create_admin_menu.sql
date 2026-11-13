-- 创建 AdminMenu（后台菜单树）单表
--
-- 背景：后台菜单树驱动 RBAC 改造 T01。目录(dir)/菜单(menu)/按钮(button) 同表，
--       permissionKey 是权限判定唯一标识，RolePermission.permissionKey 直接指向它。
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/004_create_admin_menu.sql --schema prisma/schema.prisma
--
-- 说明：
--   · 全量 IF NOT EXISTS，可重复执行（幂等）
--   · 库与 schema 存在真实漂移，绝不能用 `prisma db push` 反推，建表只能手写 SQL
--   · Postgres 不支持 ADD CONSTRAINT IF NOT EXISTS，外键用 DO 块保证幂等（沿用 001/002 的写法）
--   · 只建这一张表，不动任何既有表

CREATE TABLE IF NOT EXISTS "public"."AdminMenu" (
    "id"            SERIAL NOT NULL,
    "parentId"      INTEGER,
    "name"          TEXT NOT NULL,
    "type"          VARCHAR(16) NOT NULL,
    "icon"          TEXT,
    "path"          TEXT,
    "component"     TEXT,
    "componentName" TEXT,
    "permissionKey" TEXT,
    "sort"          INTEGER NOT NULL DEFAULT 0,
    "status"        INTEGER NOT NULL DEFAULT 1,
    "visible"       BOOLEAN NOT NULL DEFAULT true,
    "alwaysShow"    BOOLEAN NOT NULL DEFAULT false,
    "keepAlive"     BOOLEAN NOT NULL DEFAULT false,
    "isBuiltin"     BOOLEAN NOT NULL DEFAULT false,
    "createdAt"     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminMenu_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminMenu_type_check" CHECK ("type" IN ('dir','menu','button'))
);

-- permissionKey 是权限判定唯一标识；Postgres 唯一索引允许多个 NULL（目录就是 NULL），
-- 所以「目录 permissionKey 为 null」与「菜单/按钮必须非空」可以共存于同一约束。
CREATE UNIQUE INDEX IF NOT EXISTS "AdminMenu_permissionKey_key"
    ON "public"."AdminMenu" ("permissionKey");

-- 树渲染：按父节点 + 排序取子节点
CREATE INDEX IF NOT EXISTS "AdminMenu_parentId_sort_idx"
    ON "public"."AdminMenu" ("parentId", "sort");

-- 菜单可见性 / 类型过滤
CREATE INDEX IF NOT EXISTS "AdminMenu_type_status_visible_idx"
    ON "public"."AdminMenu" ("type", "status", "visible");

-- 全局排序（构建导航树时的兜底顺序）
CREATE INDEX IF NOT EXISTS "AdminMenu_status_sort_idx"
    ON "public"."AdminMenu" ("status", "sort");

-- 自引用外键：删父节点时级联删子树
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AdminMenu_parentId_fkey') THEN
        ALTER TABLE "public"."AdminMenu"
            ADD CONSTRAINT "AdminMenu_parentId_fkey"
            FOREIGN KEY ("parentId") REFERENCES "public"."AdminMenu"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
