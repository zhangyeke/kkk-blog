import type { Metadata } from "next"

import { MOCK_SPOTS } from "@/components/photo-wall/mock-spots"
import { PhotoWallDesktop } from "@/components/photo-wall/PhotoWallDesktop"
import { collectProvinces } from "@/lib/photo-wall"
import { getChinaMapPayload } from "@/service/china-map"
import type { ChinaGeoJSON } from "@/types/china-map"

export const metadata: Metadata = {
    title: "照片墙设计稿 · PC",
    robots: {index: false, follow: false},
}

/** 设计稿预览：用 mock 数据 + 真实 GeoJSON，评审通过后再接真实足迹 */
export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ province?: string; city?: string; cam?: string }>
}) {
    const params = await searchParams

    const country = await getChinaMapPayload("country")
    const geos: Record<string, ChinaGeoJSON> = {"100000": country.geo}

    const provinces = collectProvinces(MOCK_SPOTS)
    await Promise.all(
        provinces.map(async (province) => {
            const payload = await getChinaMapPayload("province", province.code)
            geos[province.code] = payload.geo
        }),
    )

    return (
        <PhotoWallDesktop
            spots={MOCK_SPOTS}
            geos={geos}
            initialProvinceCode={params.province ?? null}
            initialCityCode={params.city ?? null}
            camCode={params.cam ?? null}
        />
    )
}
