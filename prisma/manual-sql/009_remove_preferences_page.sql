-- 删除已移除的后台偏好页面菜单和对应角色授权。
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/009_remove_preferences_page.sql --schema prisma/schema.prisma
--
-- 幂等：允许在未安装过偏好菜单的数据库中安全执行。
-- 旧库在执行本脚本后会移除该菜单及角色授权；新库无需额外清理。

BEGIN;

DELETE FROM "public"."RolePermission"
WHERE "permissionKey" = 'page:preferences';

DELETE FROM "public"."AdminMenu"
WHERE "permissionKey" = 'page:preferences'
   OR "path" = '/admin/settings/preferences';

UPDATE "public"."AdminMenu"
SET "sort" = 2
WHERE "permissionKey" = 'page:menus'
  AND "parentId" = (
      SELECT "id"
      FROM "public"."AdminMenu"
      WHERE "permissionKey" = 'page:settings'
      LIMIT 1
  );

COMMIT;
