-- 内置角色与默认权限种子
--
-- 执行：
--   npx prisma db execute --file prisma/manual-sql/003_seed_builtin_roles.sql --schema prisma/schema.prisma
--
-- 说明：
--   · 全部 ON CONFLICT DO NOTHING，可重复执行（幂等），不会覆盖后台改过的授权
--   · superAdmin 一行权限都不插 —— 代码里 hasPermission 硬短路 superAdmin，
--     这样「超管权限不可剥夺」只有一处保证，也不怕有人误删授权行
--   · admin 16 行（5 page + 11 action），user 6 行，合计 22 行
--   · admin 不给 page:users / page:roles / page:settings，
--     也不给 action:user:manage / action:settings:update

INSERT INTO "public"."Role" ("code", "name", "description", "isBuiltin", "status", "scopeAll", "sort")
VALUES
    ('superAdmin', '超级管理员', '内置角色：全部页面、全部数据、全部操作', true, 1, true, 1),
    ('admin',      '管理员',     '内置角色：除用户管理与系统设置外的全部功能', true, 1, true, 2),
    ('user',       '普通用户',   '内置角色：只能访问概览与文章，且仅限自己的数据', true, 1, false, 3)
ON CONFLICT ("code") DO NOTHING;

-- admin：5 个页面 + 10 个动作 = 15 行
INSERT INTO "public"."RolePermission" ("roleCode", "permissionKey")
VALUES
    ('admin', 'page:dashboard'),
    ('admin', 'page:posts'),
    ('admin', 'page:postCategories'),
    ('admin', 'page:bookmarks'),
    ('admin', 'page:footprints'),
    ('admin', 'action:post:create'),
    ('admin', 'action:post:update'),
    ('admin', 'action:post:delete'),
    ('admin', 'action:postCategory:create'),
    ('admin', 'action:postCategory:update'),
    ('admin', 'action:postCategory:delete'),
    ('admin', 'action:bookmark:create'),
    ('admin', 'action:bookmark:delete'),
    ('admin', 'action:footprint:create'),
    ('admin', 'action:footprint:update'),
    ('admin', 'action:footprint:delete')
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;

-- user：3 个页面 + 3 个动作 = 6 行
INSERT INTO "public"."RolePermission" ("roleCode", "permissionKey")
VALUES
    ('user', 'page:dashboard'),
    ('user', 'page:posts'),
    ('user', 'page:postCategories'),
    ('user', 'action:post:create'),
    ('user', 'action:post:update'),
    ('user', 'action:post:delete')
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;
