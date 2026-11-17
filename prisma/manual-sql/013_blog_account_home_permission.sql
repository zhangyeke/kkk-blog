-- Manual equivalent of migration 20261118020000_blog_account_home_permission.
INSERT INTO "AdminMenu" (
    "surface", "position", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort", "status",
    "visible", "alwaysShow", "keepAlive", "isBuiltin"
)
SELECT
    'BLOG', 'USER_BRIEF'::"AdminMenuPosition", account_group."id", '个人中心', 'menu', 'userRound', '/blog/me',
    NULL, NULL, 'blog:account:home', 0, 1, true, false, false, true
FROM "AdminMenu" AS account_group
WHERE account_group."surface" = 'BLOG'
  AND account_group."position" = 'USER_BRIEF'
  AND account_group."type" = 'dir'
  AND account_group."componentName" = 'blog-account-menu-group'
ON CONFLICT ("permissionKey") DO NOTHING;

INSERT INTO "RolePermission" ("roleCode", "permissionKey")
SELECT role."code", 'blog:account:home'
FROM "Role" AS role
WHERE role."code" = 'user'
  AND EXISTS (
      SELECT 1
      FROM "AdminMenu"
      WHERE "permissionKey" = 'blog:account:home'
        AND "status" = 1
  )
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;
