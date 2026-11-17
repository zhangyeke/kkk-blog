"use client"

import React from "react"

import { GalleryModal } from "@/components/GalleryModal"
import { useAppStore } from "@/hooks"
import {
    collectCities,
    collectProvinces,
    countByRegion,
    countPhotos,
    filterSpots,
    groupSpots,
    sortSpots,
} from "@/lib/maps/photo-wall"
import type { ChinaGeoJSON } from "@/types/china-map"
import type { PhotoFilter, PhotoSpot } from "@/types/photo-wall"
import { FilterCapsuleBar } from "./FilterCapsuleBar"
import { MobileMapSheet } from "./MobileMapSheet"
import { PhotoWallHeader } from "./PhotoWallHeader"
import { SpotList } from "./SpotList"
import { photoWallStyle } from "./tokens"

interface PhotoWallMobileProps {
    spots: PhotoSpot[]
    geos: Record<string, ChinaGeoJSON>
    initialProvinceCode?: string | null
    initialCityCode?: string | null
    /** 设计稿演示用：默认展开地图 */
    initialMapOpen?: boolean
}

type GalleryState = {
    urls: string[]
    index: number
    meta: { provinceName: string; cityName: string; districtName: string }
    uniqueId: string
}

export function PhotoWallMobile({
    spots,
    geos,
    initialProvinceCode = null,
    initialCityCode = null,
    initialMapOpen = false,
}: PhotoWallMobileProps) {
    const primary = useAppStore((state) => state.themes.primary)

    const [filter, setFilter] = React.useState<PhotoFilter>({
        provinceCode: initialProvinceCode,
        cityCode: initialCityCode,
    })
    const [mapOpen, setMapOpen] = React.useState(initialMapOpen)
    const [gallery, setGallery] = React.useState<GalleryState | null>(null)

    const sorted = React.useMemo(() => sortSpots(spots), [spots])
    const visible = React.useMemo(() => filterSpots(sorted, filter), [sorted, filter])
    const groups = React.useMemo(() => groupSpots(visible), [visible])

    const level = filter.provinceCode ? "province" : "country"
    const geo = filter.provinceCode ? geos[filter.provinceCode] ?? null : geos["100000"] ?? null

    const provinceCounts = React.useMemo(() => countByRegion(sorted).province, [sorted])
    const cityCounts = React.useMemo(() => {
        const scoped = sorted.filter((spot) => spot.provinceCode === filter.provinceCode)
        return countByRegion(scoped).city
    }, [sorted, filter.provinceCode])

    const provinces = React.useMemo(
        () =>
            collectProvinces(sorted).map((province) => ({
                ...province,
                count: provinceCounts.get(province.code) ?? 0,
            })),
        [sorted, provinceCounts],
    )

    const cities = React.useMemo(() => {
        if (!filter.provinceCode) return []
        return collectCities(sorted, filter.provinceCode).map((city) => ({
            ...city,
            count: cityCounts.get(city.code) ?? 0,
        }))
    }, [sorted, filter.provinceCode, cityCounts])

    const provinceName = React.useMemo(
        () => sorted.find((spot) => spot.provinceCode === filter.provinceCode)?.provinceName ?? null,
        [sorted, filter.provinceCode],
    )
    const cityName = React.useMemo(
        () => sorted.find((spot) => spot.cityCode === filter.cityCode)?.cityName ?? null,
        [sorted, filter.cityCode],
    )

    const handleSelectRegion = React.useCallback((region: { code: string; name: string }) => {
        setFilter((prev) => {
            if (prev.provinceCode === null) return {provinceCode: region.code, cityCode: null}
            return {provinceCode: prev.provinceCode, cityCode: region.code}
        })
        // 选到城市后自动收起地图，留 180ms 让选中态被看见
        window.setTimeout(() => setMapOpen(false), 180)
    }, [])

    const handleReset = React.useCallback(() => setFilter({provinceCode: null, cityCode: null}), [])

    const handleOpen = React.useCallback((spot: PhotoSpot, photoIndex: number) => {
        setGallery({
            urls: spot.photos,
            index: photoIndex,
            meta: {
                provinceName: spot.provinceName,
                cityName: spot.cityName,
                districtName: spot.districtName,
            },
            uniqueId: `photo-wall-m-${spot.id}`,
        })
    }, [])

    const closeGallery = React.useCallback(() => setGallery(null), [])

    return (
        <div
            className="container pt-[calc(var(--header-height)+1rem)] pb-12"
            style={photoWallStyle(primary)}
        >
            <PhotoWallHeader
                variant="mobile"
                photoCount={countPhotos(visible)}
                spotCount={visible.length}
                filtered={Boolean(filter.provinceCode || filter.cityCode)}
                onReset={handleReset}
            />

            <FilterCapsuleBar
                provinces={provinces}
                provinceCode={filter.provinceCode}
                cities={cities}
                cityCode={filter.cityCode}
                onSelectProvince={(code) => setFilter({provinceCode: code, cityCode: null})}
                onSelectCity={(code) =>
                    setFilter((prev) => ({provinceCode: prev.provinceCode, cityCode: code}))
                }
                onOpenMap={() => setMapOpen(true)}
            />

            <div className="mt-3">
                <SpotList
                    groups={groups}
                    variant="mobile"
                    onOpen={handleOpen}
                    onReset={handleReset}
                    layoutIdPrefix="photo-wall-m"
                    emptyText={
                        filter.cityCode
                            ? "这个城市还没有照片"
                            : filter.provinceCode
                                ? "这个省份还没有照片"
                                : "还没有照片足迹"
                    }
                />
            </div>

            <MobileMapSheet
                open={mapOpen}
                onClose={() => setMapOpen(false)}
                geo={geo}
                level={level}
                provinceName={provinceName}
                cityName={cityName}
                selectedCode={filter.cityCode ?? filter.provinceCode}
                counts={level === "country" ? provinceCounts : cityCounts}
                cities={cities}
                onSelectRegion={handleSelectRegion}
                onSelectCity={(code) =>
                    setFilter((prev) => ({provinceCode: prev.provinceCode, cityCode: code}))
                }
                onReset={handleReset}
            />

            <GalleryModal
                isOpen={gallery !== null}
                urls={gallery?.urls ?? []}
                defaultIndex={gallery?.index}
                locationMeta={gallery?.meta}
                uniqueId={gallery?.uniqueId ?? "photo-wall-m"}
                onBackdropClick={closeGallery}
                onCloseButtonClick={closeGallery}
            />
        </div>
    )
}
