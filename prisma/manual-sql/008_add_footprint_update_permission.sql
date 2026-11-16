-- 足迹编辑权限与按钮种子
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/008_add_footprint_update_permission.sql --schema prisma/schema.prisma
--
-- 可重复执行。为已有的足迹管理角色补上编辑权限，保持其创建权限配置。

INSERT INTO "public"."AdminMenu" (
    "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort",
    "status", "visible", "isBuiltin"
)
SELECT
    parent."id", '编辑足迹', 'button', NULL, NULL,
    NULL, NULL, 'action:footprint:update', 2,
    1, true, true
FROM "public"."AdminMenu" AS parent
WHERE parent."permissionKey" = 'page:footprints'
ON CONFLICT ("permissionKey") DO UPDATE SET
    "parentId" = EXCLUDED."parentId",
    "name" = EXCLUDED."name",
    "type" = EXCLUDED."type",
    "sort" = EXCLUDED."sort",
    "status" = 1,
    "visible" = true,
    "isBuiltin" = true;

UPDATE "public"."AdminMenu"
SET "sort" = 3
WHERE "permissionKey" = 'action:footprint:delete';

INSERT INTO "public"."RolePermission" ("roleCode", "permissionKey")
SELECT "roleCode", 'action:footprint:update'
FROM "public"."RolePermission"
WHERE "permissionKey" = 'action:footprint:create'
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;
