-- Store the target area of each menu independently from the permission surface.
DO $$ BEGIN
    CREATE TYPE "AdminMenuPosition" AS ENUM ('ADMIN', 'BLOG_NAV', 'USER_BRIEF');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "AdminMenu"
    ADD COLUMN IF NOT EXISTS "position" "AdminMenuPosition" NOT NULL DEFAULT 'ADMIN';

UPDATE "AdminMenu"
SET "position" = CASE
    WHEN "surface" = 'BLOG' THEN 'BLOG_NAV'::"AdminMenuPosition"
    ELSE 'ADMIN'::"AdminMenuPosition"
END;

WITH RECURSIVE personal_menu("id") AS (
    SELECT "id"
    FROM "AdminMenu"
    WHERE "surface" = 'BLOG'
      AND "type" = 'dir'
      AND "componentName" = 'blog-account-menu-group'
    UNION
    SELECT child."id"
    FROM "AdminMenu" AS child
    JOIN personal_menu AS parent ON child."parentId" = parent."id"
)
UPDATE "AdminMenu"
SET "position" = 'USER_BRIEF'
WHERE "id" IN (SELECT "id" FROM personal_menu);

CREATE INDEX IF NOT EXISTS "AdminMenu_position_parentId_sort_idx"
    ON "AdminMenu"("position", "parentId", "sort");
