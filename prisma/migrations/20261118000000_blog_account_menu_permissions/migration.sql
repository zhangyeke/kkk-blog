-- Move UserBrief account links into the role-managed Blog menu tree.
INSERT INTO "AdminMenu" (
    "id", "surface", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort", "status",
    "visible", "alwaysShow", "keepAlive", "isBuiltin"
)
VALUES
    (1010, 'BLOG', NULL, '账户菜单', 'dir', NULL, '/blog/me', NULL, 'blog-account-menu-group', NULL, 5, 1, true, false, false, true),
    (1011, 'BLOG', 1010, '记录足迹', 'menu', 'footprints', '/blog/me/footprints/edit', NULL, NULL, 'blog:account:footprint-create', 1, 1, true, false, false, true),
    (1012, 'BLOG', 1010, '添加书签', 'menu', 'bookmarkPlus', '/blog/me/bookmark/edit', NULL, NULL, 'blog:account:bookmark-create', 2, 1, true, false, false, true),
    (1013, 'BLOG', 1010, '我的文章', 'menu', 'notebookText', '/blog/me/articles', NULL, NULL, 'blog:account:articles', 3, 1, true, false, false, true),
    (1014, 'BLOG', 1010, '我的收藏', 'menu', 'star', '/blog/me/favorite', NULL, NULL, 'blog:account:favorite', 4, 1, true, false, false, true),
    (1015, 'BLOG', 1010, '写文章', 'menu', 'notebookPen', '/blog/article/write', NULL, NULL, 'blog:account:write', 5, 1, true, false, false, true),
    (1016, 'BLOG', 1010, '设置', 'menu', 'settings', '/blog/setting', NULL, NULL, 'blog:account:settings', 6, 1, true, false, false, true)
ON CONFLICT ("id") DO NOTHING;

-- Keep the regular-user links that were previously visible without a role check.
-- Footprint creation and bookmark creation remain superAdmin-only by default.
INSERT INTO "RolePermission" ("roleCode", "permissionKey")
SELECT role."code", permission."key"
FROM "Role" AS role
CROSS JOIN (VALUES
    ('blog:account:articles'),
    ('blog:account:favorite'),
    ('blog:account:write'),
    ('blog:account:settings')
) AS permission("key")
WHERE role."code" = 'user'
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('"public"."AdminMenu"', 'id'),
    GREATEST((SELECT MAX("id") FROM "public"."AdminMenu"), 1)
);
