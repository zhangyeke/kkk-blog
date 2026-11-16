-- 创建 Role / RolePermission 两张表
--
-- 背景：后台动态权限改造 T01。schema.prisma 里已声明 Role / RolePermission，
--       但库与 schema 存在真实漂移，绝不能用 `prisma db push` 反推（会误删改数据），
--       所以建表只能手写 SQL。
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/002_create_role_permission.sql --schema prisma/schema.prisma
--
-- 说明：
--   · 全量 IF NOT EXISTS，可重复执行（幂等）
--   · Role.code 是业务主键 —— User.roles 逗号串里存的就是 code，
--     RolePermission 通过 roleCode 引用它（不是 id），判定时手上只有 code
--   · Postgres 不支持 ADD CONSTRAINT IF NOT EXISTS，用 DO 块保证外键幂等（沿用 001 的写法）
--   · 只建这两张表，不动任何既有表

CREATE TABLE IF NOT EXISTS "public"."Role" (
    "id"          SERIAL NOT NULL,
    "code"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "isBuiltin"   BOOLEAN NOT NULL DEFAULT false,
    "status"      INTEGER NOT NULL DEFAULT 1,
    "scopeAll"    BOOLEAN NOT NULL DEFAULT false,
    "sort"        INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- code 唯一：业务主键
CREATE UNIQUE INDEX IF NOT EXISTS "Role_code_key"
    ON "public"."Role" ("code");

-- 角色列表按「状态 + 排序」取
CREATE INDEX IF NOT EXISTS "Role_status_sort_idx"
    ON "public"."Role" ("status", "sort");

CREATE TABLE IF NOT EXISTS "public"."RolePermission" (
    "id"            SERIAL NOT NULL,
    "roleCode"      TEXT NOT NULL,
    "permissionKey" TEXT NOT NULL,
    "createdAt"     TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- 同一角色同一权限只存一行
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleCode_permissionKey_key"
    ON "public"."RolePermission" ("roleCode", "permissionKey");

-- 外键：RolePermission.roleCode -> Role.code，删角色时级联清掉授权行
-- Postgres 不支持 ADD CONSTRAINT IF NOT EXISTS，用 DO 块保证幂等
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RolePermission_roleCode_fkey') THEN
        ALTER TABLE "public"."RolePermission"
            ADD CONSTRAINT "RolePermission_roleCode_fkey"
            FOREIGN KEY ("roleCode") REFERENCES "public"."Role"("code")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
