-- 为后台概览统计公开书签点击量。
-- 可重复执行；已有书签的历史点击量以 0 初始化，从此处开始累计。

ALTER TABLE "public"."Bookmark"
    ADD COLUMN IF NOT EXISTS "clickCount" INTEGER NOT NULL DEFAULT 0;
