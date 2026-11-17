-- AdminMenu 内置菜单初始种子（32 行）
--
-- ⚠️ 书签的多级改造见 `006_bookmark_menu_tree.sql`（38 行的最终结构）。
--    全新库请依次执行 005 → 006；已有库可幂等执行 006，再执行 009 清理旧偏好菜单。
--    `lib/admin-menu-seed.ts` 与 005+006 的累积结果逐字段一致。
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/005_seed_admin_menu.sql --schema prisma/schema.prisma
--
-- 说明：
--   · 全部 ON CONFLICT ("id") DO NOTHING，可重复执行（幂等），不会覆盖后台改过的菜单
--   · 必须带 setval：否则后续「新增菜单」拿到的序列值会从 1 开始，直接撞已有主键
--   · 全部 status=1、visible=true、isBuiltin=true
--   · 目录（dir）permissionKey 为 NULL（纯分组），菜单（menu）page:*，按钮（button）action:*
--   · 行的 id 顺序即拓扑顺序：子节点 id 恒大于父节点 id，
--     因此单条多行 INSERT 里自引用外键一定能在同一语句内找到父行
--   · 这 32 行的 permissionKey 覆盖了 RolePermission 现有 22 行的全部 key，
--     因此「授权零迁移」：现有授权不需要改一行，菜单树就能全部对上

INSERT INTO "public"."AdminMenu" (
    "id", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort",
    "status", "visible", "isBuiltin"
)
VALUES
    -- ── 一级 ──
    (1,  NULL, '概览',     'menu', 'dashboard',  '/admin',                      'app/admin/page.tsx',                         'dashboard',      'page:dashboard',      1, 1, true, true),
    (2,  NULL, '文章管理', 'dir',  'posts',      '/admin/posts',                NULL,                                         'posts',          NULL,                  2, 1, true, true),
    -- ── 文章管理 子项 ──
    (3,  2,    '文章',     'menu', NULL,         '/admin/posts',                'app/admin/posts/page.tsx',                   'posts',          'page:posts',          1, 1, true, true),
    (4,  2,    '文章分类', 'menu', NULL,         '/admin/posts/categories',     'app/admin/posts/categories/page.tsx',        'postCategories', 'page:postCategories', 2, 1, true, true),
    -- ── 一级 ──
    (5,  NULL, '书签',     'menu', 'bookmarks',  '/admin/bookmarks',            'app/admin/bookmarks/page.tsx',               'bookmarks',      'page:bookmarks',      3, 1, true, true),
    (6,  NULL, '足迹',     'menu', 'footprints', '/admin/footprints',           'app/admin/footprints/page.tsx',              'footprints',     'page:footprints',     4, 1, true, true),
    (7,  NULL, '用户管理', 'dir',  'users',      '/admin/users',                NULL,                                         'users',          NULL,                  5, 1, true, true),
    -- ── 用户管理 子项 ──
    (8,  7,    '用户',     'menu', NULL,         '/admin/users',                'app/admin/users/page.tsx',                   'users',          'page:users',          1, 1, true, true),
    (9,  7,    '角色管理', 'menu', NULL,         '/admin/users/roles',          'app/admin/users/roles/page.tsx',             'roles',          'page:roles',          2, 1, true, true),
    -- ── 一级 ──
    (10, NULL, '设置',     'dir',  'settings',   '/admin/settings',             NULL,                                         'settings',       NULL,                  6, 1, true, true),
    -- ── 设置 子项 ──
    (11, 10,   '站点信息', 'menu', NULL,         '/admin/settings',             'app/admin/settings/page.tsx',                'settings',       'page:settings',       1, 1, true, true),
    (13, 10,   '菜单管理', 'menu', NULL,         '/admin/settings/permissions', 'app/admin/settings/permissions/page.tsx',    'menus',          'page:menus',          2, 1, true, true),

    -- ── 按钮：文章 ──
    (14, 3,    '新建文章', 'button', NULL, NULL, NULL, NULL, 'action:post:create', 1, 1, true, true),
    (15, 3,    '编辑文章', 'button', NULL, NULL, NULL, NULL, 'action:post:update', 2, 1, true, true),
    (16, 3,    '删除文章', 'button', NULL, NULL, NULL, NULL, 'action:post:delete', 3, 1, true, true),

    -- ── 按钮：文章分类 ──
    (17, 4,    '新建分类', 'button', NULL, NULL, NULL, NULL, 'action:postCategory:create', 1, 1, true, true),
    (18, 4,    '编辑分类', 'button', NULL, NULL, NULL, NULL, 'action:postCategory:update', 2, 1, true, true),
    (19, 4,    '删除分类', 'button', NULL, NULL, NULL, NULL, 'action:postCategory:delete', 3, 1, true, true),

    -- ── 按钮：书签 ──
    (20, 5,    '新建书签', 'button', NULL, NULL, NULL, NULL, 'action:bookmark:create', 1, 1, true, true),
    (21, 5,    '删除书签', 'button', NULL, NULL, NULL, NULL, 'action:bookmark:delete', 2, 1, true, true),

    -- ── 按钮：足迹 ──
    (22, 6,    '新建足迹', 'button', NULL, NULL, NULL, NULL, 'action:footprint:create', 1, 1, true, true),
    (23, 6,    '删除足迹', 'button', NULL, NULL, NULL, NULL, 'action:footprint:delete', 3, 1, true, true),
    (39, 6,    '编辑足迹', 'button', NULL, NULL, NULL, NULL, 'action:footprint:update', 2, 1, true, true),

    -- ── 按钮：用户 ──
    (24, 8,    '管理用户', 'button', NULL, NULL, NULL, NULL, 'action:user:manage', 1, 1, true, true),

    -- ── 按钮：设置 ──
    (25, 11,   '修改设置', 'button', NULL, NULL, NULL, NULL, 'action:settings:update', 1, 1, true, true),

    -- ── 按钮：角色管理 ──
    (26, 9,    '新建角色', 'button', NULL, NULL, NULL, NULL, 'action:role:create', 1, 1, true, true),
    (27, 9,    '编辑角色', 'button', NULL, NULL, NULL, NULL, 'action:role:update', 2, 1, true, true),
    (28, 9,    '删除角色', 'button', NULL, NULL, NULL, NULL, 'action:role:delete', 3, 1, true, true),
    (29, 9,    '分配权限', 'button', NULL, NULL, NULL, NULL, 'action:role:assign', 4, 1, true, true),

    -- ── 按钮：菜单管理 ──
    (30, 13,   '新建菜单', 'button', NULL, NULL, NULL, NULL, 'action:menu:create', 1, 1, true, true),
    (31, 13,   '编辑菜单', 'button', NULL, NULL, NULL, NULL, 'action:menu:update', 2, 1, true, true),
    (32, 13,   '删除菜单', 'button', NULL, NULL, NULL, NULL, 'action:menu:delete', 3, 1, true, true)
ON CONFLICT ("id") DO NOTHING;

-- 序列校准：种子写死了 id，序列本身不会自增。
-- 不 setval 的话，后台第一次「新增菜单」会从 1 开始分配 id，直接撞主键。
SELECT setval(
    pg_get_serial_sequence('"public"."AdminMenu"', 'id'),
    GREATEST((SELECT MAX("id") FROM "public"."AdminMenu"), 1)
);
