-- 创建 Footprint 表
--
-- 背景：schema.prisma 声明了 Footprint，但线上库（Neon ep-hidden-wind-a1atc41e）
--       实际只有 Account / Post / PostCategory / Session / User / VerificationToken 六张表。
--       因此足迹功能一直查不到表。
--
-- 执行：
--   npx prisma db execute --stdin --url "$DATABASE_URL" < prisma/manual-sql/001_create_footprint.sql
--
-- 说明：
--   · 全量 IF NOT EXISTS，可重复执行
--   · 只建这一张表，不动 Post / Bookmark / Favorite
--   · lat / lng 存 WGS-84 原始坐标，渲染前按境内/境外决定是否转 GCJ-02
--   · updatedAt 加了 DEFAULT CURRENT_TIMESTAMP，防裸 SQL 插入时报非空

CREATE TABLE IF NOT EXISTS "public"."Footprint" (
    "id"        SERIAL NOT NULL,
    "userId"    UUID NOT NULL,
    "province"  INTEGER NOT NULL,
    "city"      INTEGER NOT NULL,
    "area"      INTEGER,
    "address"   TEXT,
    "album"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "lat"       DOUBLE PRECISION,
    "lng"       DOUBLE PRECISION,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Footprint_pkey" PRIMARY KEY ("id")
);

-- 按用户查列表（getMeFootprints）
CREATE INDEX IF NOT EXISTS "Footprint_userId_idx"
    ON "public"."Footprint" ("userId");

-- 地图按视野范围查点
CREATE INDEX IF NOT EXISTS "Footprint_lat_lng_idx"
    ON "public"."Footprint" ("lat", "lng");

-- 外键：Postgres 不支持 ADD CONSTRAINT IF NOT EXISTS，用 DO 块保证幂等
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Footprint_userId_fkey'
    ) THEN
        ALTER TABLE "public"."Footprint"
            ADD CONSTRAINT "Footprint_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
