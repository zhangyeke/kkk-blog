-- ============================================================
-- 006: 书签菜单改为多级（书签管理 / 书签 / 书签分类）
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/006_bookmark_menu_tree.sql --schema prisma/schema.prisma
--
-- 背景：
--   lib/admin-menu-seed.ts（代码侧降级种子）早已是多级结构，
--   旧版 005 落库时还是扁平结构，DB 里 id=5 是「书签」菜单。
--   侧栏读的是 DB，所以页面一直显示单层。本脚本把现有库升级到与代码同源。
--
-- 幂等：全部用 ON CONFLICT DO UPDATE / DO NOTHING，可重复执行。
-- 不需要 prisma generate（schema.prisma 未变）。
-- ============================================================

-- 1) 一级节点 5：菜单「书签」→ 目录「书签管理」（permissionKey 置空，纯分组）
INSERT INTO "public"."AdminMenu" (
    "id", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort",
    "status", "visible", "isBuiltin"
)
VALUES (5, NULL, '书签管理', 'dir', 'bookmarks', '/admin/bookmarks',
        NULL, 'bookmarks', NULL, 3, 1, true, true)
ON CONFLICT ("id") DO UPDATE SET
    "parentId" = EXCLUDED."parentId",
    "name" = EXCLUDED."name",
    "type" = EXCLUDED."type",
    "icon" = EXCLUDED."icon",
    "path" = EXCLUDED."path",
    "component" = EXCLUDED."component",
    "componentName" = EXCLUDED."componentName",
    "permissionKey" = EXCLUDED."permissionKey",
    "sort" = EXCLUDED."sort",
    "status" = 1,
    "visible" = true,
    "isBuiltin" = true;

-- 2) 二级节点：书签 / 书签分类
INSERT INTO "public"."AdminMenu" (
    "id", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort",
    "status", "visible", "isBuiltin"
)
VALUES
    (33, 5, '书签', 'menu', NULL, '/admin/bookmarks',
        'app/admin/bookmarks/page.tsx', 'bookmarks', 'page:bookmarks', 1, 1, true, true),
    (34, 5, '书签分类', 'menu', NULL, '/admin/bookmarks/categories',
        'app/admin/bookmarks/categories/page.tsx', 'bookmarkCategories', 'page:bookmarkCategories', 2, 1, true, true)
ON CONFLICT ("id") DO UPDATE SET
    "parentId" = EXCLUDED."parentId",
    "name" = EXCLUDED."name",
    "type" = EXCLUDED."type",
    "icon" = EXCLUDED."icon",
    "path" = EXCLUDED."path",
    "component" = EXCLUDED."component",
    "componentName" = EXCLUDED."componentName",
    "permissionKey" = EXCLUDED."permissionKey",
    "sort" = EXCLUDED."sort",
    "status" = 1,
    "visible" = true,
    "isBuiltin" = true;

-- 3) 按钮：20/21 从 id=5 挪到 id=33，并补齐编辑书签与书签分类的三个动作
INSERT INTO "public"."AdminMenu" (
    "id", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort",
    "status", "visible", "isBuiltin"
)
VALUES
    (20, 33, '新建书签', 'button', NULL, NULL, NULL, NULL, 'action:bookmark:create', 1, 1, true, true),
    (35, 33, '编辑书签', 'button', NULL, NULL, NULL, NULL, 'action:bookmark:update', 2, 1, true, true),
    (21, 33, '删除书签', 'button', NULL, NULL, NULL, NULL, 'action:bookmark:delete', 3, 1, true, true),
    (36, 34, '新建书签分类', 'button', NULL, NULL, NULL, NULL, 'action:bookmarkCategory:create', 1, 1, true, true),
    (37, 34, '编辑书签分类', 'button', NULL, NULL, NULL, NULL, 'action:bookmarkCategory:update', 2, 1, true, true),
    (38, 34, '删除书签分类', 'button', NULL, NULL, NULL, NULL, 'action:bookmarkCategory:delete', 3, 1, true, true)
ON CONFLICT ("id") DO UPDATE SET
    "parentId" = EXCLUDED."parentId",
    "name" = EXCLUDED."name",
    "type" = EXCLUDED."type",
    "permissionKey" = EXCLUDED."permissionKey",
    "sort" = EXCLUDED."sort",
    "status" = 1,
    "visible" = true,
    "isBuiltin" = true;

-- 4) 授权迁移：原来有 page:bookmarks 的角色，同步拿到新页面与新按钮的 key。
--    否则非 superAdmin 角色会看不到「书签分类」、也无法编辑书签。
--    superAdmin 硬短路，RolePermission 里没有它的行，不需要处理。
INSERT INTO "public"."RolePermission" ("roleCode", "permissionKey")
SELECT r."roleCode", k."key"
FROM (
    SELECT DISTINCT "roleCode"
    FROM "public"."RolePermission"
    WHERE "permissionKey" = 'page:bookmarks'
) r
CROSS JOIN (
    VALUES
        ('page:bookmarkCategories'),
        ('action:bookmark:update'),
        ('action:bookmarkCategory:create'),
        ('action:bookmarkCategory:update'),
        ('action:bookmarkCategory:delete')
) AS k("key")
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;

-- 5) 序列校准：脚本写死了 id，不自增，新增菜单会撞主键
SELECT setval(
    pg_get_serial_sequence('"public"."AdminMenu"', 'id'),
    GREATEST((SELECT MAX("id") FROM "public"."AdminMenu"), 1)
);
