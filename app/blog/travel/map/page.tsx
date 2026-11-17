import type { Metadata } from "next"

import { PhotoMap } from "@/components/photo-map/PhotoMap"
import { getAMapSettings } from "@/lib/maps/amap-config"
import { toMapPoints } from "@/lib/maps/geo/map-points"
import { footprintRowsToPhotoSpots } from "@/lib/maps/photo-wall"
import { getMappedFootprints } from "@/service/footprint"
import { createPublicPageMetadata } from "@/lib/seo/metadata"
import { BLOG_PAGE_KEYS, requireBlogPageAccess } from "@/lib/blog/permissions"

export const metadata: Metadata = createPublicPageMetadata({
    title: "照片地图",
    description: "按拍摄地点铺开的旅行照片",
    path: "/blog/travel/map",
})

export const dynamic = "force-dynamic"

export default async function Page() {
    await requireBlogPageAccess(BLOG_PAGE_KEYS.travelMap)
    const {jsKey, jsUrl} = await getAMapSettings()
    const result = await getMappedFootprints()
    const rows = result.code === 200 && Array.isArray(result.data?.list) ? result.data.list : []
    const points = toMapPoints(rows)
    const mappedIds = new Set(points.map((point) => point.id))
    const spots = footprintRowsToPhotoSpots(rows.filter((row) => mappedIds.has(row.id)))

    return (
        <div className="h-[100dvh] overflow-hidden">
            {/* 全屏地图：顶到站点 header 下沿，铺满到视口底部，不叠任何悬浮卡片 */}
            <PhotoMap
                skin="vector"
                apiKey={jsKey}
                apiUrl={jsUrl}
                points={points}
                spots={spots}
                className="fixed inset-x-0 bottom-0 top-[var(--header-height)] h-auto w-full"
            />

            {/* 页面没有可见标题，保留可读标题给读屏与 SEO */}
            <h1 className="sr-only">照片地图</h1>
        </div>
    )
}
