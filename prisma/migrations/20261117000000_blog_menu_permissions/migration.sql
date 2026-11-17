DO $$ BEGIN
    CREATE TYPE "AdminMenuSurface" AS ENUM ('ADMIN', 'BLOG');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "AdminMenu"
    ADD COLUMN IF NOT EXISTS "surface" "AdminMenuSurface" NOT NULL DEFAULT 'ADMIN';

CREATE INDEX IF NOT EXISTS "AdminMenu_surface_parentId_sort_idx"
    ON "AdminMenu"("surface", "parentId", "sort");

INSERT INTO "AdminMenu" (
    "id", "surface", "parentId", "name", "type", "icon", "path",
    "component", "componentName", "permissionKey", "sort", "status",
    "visible", "alwaysShow", "keepAlive", "isBuiltin"
)
VALUES
    (1001, 'BLOG', NULL, '首页', 'dir', NULL, '/blog', NULL, NULL, NULL, 1, 1, true, false, false, true),
    (1002, 'BLOG', 1001, '博客', 'menu', NULL, '/blog', NULL, NULL, 'blog:page:home', 1, 1, true, false, false, true),
    (1003, 'BLOG', 1001, '起始页', 'menu', NULL, '/blog/index', NULL, NULL, 'blog:page:start', 2, 1, true, false, false, true),
    (1004, 'BLOG', NULL, '记录', 'dir', NULL, '/blog/article/list', NULL, 'blog-category-group', NULL, 2, 1, true, false, false, true),
    (1005, 'BLOG', 1004, '文章列表', 'menu', NULL, '/blog/article/list', NULL, NULL, 'blog:page:article-list', 1, 1, true, false, false, true),
    (1006, 'BLOG', NULL, '藏宝阁', 'dir', NULL, '/blog/bookmark', NULL, NULL, NULL, 3, 1, true, false, false, true),
    (1007, 'BLOG', 1006, '书签', 'menu', NULL, '/blog/bookmark', NULL, NULL, 'blog:page:bookmarks', 1, 1, true, false, false, true),
    (1008, 'BLOG', 1006, '江山时序', 'menu', NULL, '/blog/jiangshan-map', NULL, NULL, 'blog:page:jiangshan-map', 2, 1, true, false, false, true),
    (1009, 'BLOG', NULL, '旅行足迹', 'menu', NULL, '/blog/travel/map', NULL, NULL, 'blog:page:travel-map', 4, 1, true, false, false, true)
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleCode", "permissionKey")
SELECT role."code", permission."key"
FROM "Role" AS role
CROSS JOIN (VALUES
    ('blog:page:home'),
    ('blog:page:start'),
    ('blog:page:article-list'),
    ('blog:page:bookmarks'),
    ('blog:page:jiangshan-map'),
    ('blog:page:travel-map')
) AS permission("key")
WHERE role."code" = 'user'
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;

INSERT INTO "RolePermission" ("roleCode", "permissionKey")
SELECT role."code", 'blog:category:' || category."id"::text
FROM "Role" AS role
CROSS JOIN "PostCategory" AS category
WHERE role."code" = 'user' AND category."status" = 1
ON CONFLICT ("roleCode", "permissionKey") DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('"public"."AdminMenu"', 'id'),
    GREATEST((SELECT MAX("id") FROM "public"."AdminMenu"), 1)
);
