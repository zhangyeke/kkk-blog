import type { Metadata } from "next"

import { MOCK_SPOTS } from "@/components/photo-wall/mock-spots"
import { PhotoWallMobile } from "@/components/photo-wall/PhotoWallMobile"
import { collectProvinces } from "@/lib/photo-wall"
import { getChinaMapPayload } from "@/service/china-map"
import type { ChinaGeoJSON } from "@/types/china-map"

export const metadata: Metadata = {
    title: "照片墙设计稿 · 移动端",
    robots: {index: false, follow: false},
}

/** 移动端设计稿：桌面打开时收成手机宽度，手机上就是正常全宽 */
export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ province?: string; city?: string; map?: string }>
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
        <div className="mx-auto w-full max-w-[430px] lg:border-x lg:border-border">
            <PhotoWallMobile
                spots={MOCK_SPOTS}
                geos={geos}
                initialProvinceCode={params.province ?? null}
                initialCityCode={params.city ?? null}
                initialMapOpen={params.map === "1"}
            />
        </div>
    )
}
