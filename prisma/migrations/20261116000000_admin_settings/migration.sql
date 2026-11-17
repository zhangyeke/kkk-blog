CREATE TABLE "AdminSettingGroup" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(240),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSettingGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSettingField" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(240),
    "config" JSONB NOT NULL DEFAULT '{}',
    "value" JSONB,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSettingField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminSettingGroup_key_key" ON "AdminSettingGroup"("key");
CREATE INDEX "AdminSettingGroup_sort_id_idx" ON "AdminSettingGroup"("sort", "id");
CREATE UNIQUE INDEX "AdminSettingField_groupId_key_key" ON "AdminSettingField"("groupId", "key");
CREATE INDEX "AdminSettingField_groupId_sort_id_idx" ON "AdminSettingField"("groupId", "sort", "id");

ALTER TABLE "AdminSettingField"
ADD CONSTRAINT "AdminSettingField_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "AdminSettingGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AdminSettingGroup" ("key", "name", "description", "sort", "isBuiltin")
VALUES ('branding', '后台品牌', '管理后台侧栏品牌信息与浏览器标签图标。', 0, true)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "AdminSettingField" ("groupId", "key", "label", "type", "required", "config", "value", "sort", "isBuiltin")
SELECT group_row."id", field_row."key", field_row."label", field_row."type", field_row."required",
       field_row."config"::jsonb, field_row."value"::jsonb, field_row."sort", true
FROM "AdminSettingGroup" AS group_row
CROSS JOIN (VALUES
    ('name', '后台名称', 'string', true, '{"placeholder":"博客后台"}', '"博客后台"', 0),
    ('subtitle', '后台副标题', 'string', false, '{"placeholder":"BLOG ADMIN"}', '"BLOG ADMIN"', 1),
    ('icon', '后台图标', 'iconPicker', true, '{}', '"book"', 2),
    ('favicon', '浏览器标签图标', 'imageUpload', false, '{}', '""', 3)
) AS field_row("key", "label", "type", "required", "config", "value", "sort")
WHERE group_row."key" = 'branding'
ON CONFLICT ("groupId", "key") DO NOTHING;
