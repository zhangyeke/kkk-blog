import type { Metadata } from "next"

import { env } from "env.mjs"
import { PhotoMap } from "@/components/photo-map/PhotoMap"
import { toMapPoints } from "@/lib/geo/map-points"
import { footprintRowsToPhotoSpots } from "@/lib/photo-wall"
import { getMappedFootprints } from "@/service/footprint"

export const metadata: Metadata = {
    title: "照片地图",
    description: "按拍摄地点铺开的旅行照片",
}

export const dynamic = "force-dynamic"

export default async function Page() {
    // 服务端读取 key（GAODI_MAP_KEY 没有 NEXT_PUBLIC_ 前缀，不会进客户端 bundle）
    const apiKey = env.GAODI_MAP_KEY ?? ""
    const securityCode = env.GAODI_SECURITY_CODE
    // 配了自定义样式就切回矢量底图——只有矢量样式能做到蔚蓝海水 + 绿土陆地
    const customStyle = env.GAODI_MAP_STYLE

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
                mapStyle={customStyle}
                apiKey={apiKey}
                securityCode={securityCode}
                points={points}
                spots={spots}
                className="fixed inset-x-0 bottom-0 top-[var(--header-height)] h-auto w-full"
            />

            {/* 页面没有可见标题，保留可读标题给读屏与 SEO */}
            <h1 className="sr-only">照片地图</h1>
        </div>
    )
}
