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
} from "@/lib/photo-wall"
import type { ChinaGeoJSON } from "@/types/china-map"
import type { PhotoFilter, PhotoSpot } from "@/types/photo-wall"
import {
  type Camera,
  CAMERA_COUNTRY,
  cameraFor,
  createMainFit,
  MAP_VIEW,
  projectRegions,
  projectRegionsInFit,
} from "./geo-projection"
import { MapPanel } from "./MapPanel"
import { PhotoWallHeader } from "./PhotoWallHeader"
import { PhotoWallSidebarFilters } from "./PhotoWallSidebarFilters"
import { ProvinceRail } from "./ProvinceRail"
import { SpotList } from "./SpotList"
import { photoWallStyle } from "./tokens"

interface PhotoWallDesktopProps {
  spots: PhotoSpot[]
  /** "100000" + 各出现省份的 geo */
  geos?: Record<string, ChinaGeoJSON>
  /** sidebar 模式只展示地点与照片，不重复渲染照片墙自己的地图。 */
  layout?: "page" | "sidebar"
  /** 地点点击及预览照片点击时的外部地图联动。 */
  onLocateSpot?: (spot: PhotoSpot) => void
  galleryZIndex?: number
  initialProvinceCode?: string | null
  initialCityCode?: string | null
  /** 设计稿用：强制相机目标（省或市 adcode），不传则由筛选推导 */
  camCode?: string | null
}

const EMPTY_GEOS: Record<string, ChinaGeoJSON> = {}

type GalleryState = {
  urls: string[]
  index: number
  meta: { provinceName: string; cityName: string; districtName: string }
  uniqueId: string
}

/** 340000 → 省；340100 → 市；341002 → 区（省份取前两位 + 0000） */
function splitAdcode(code: string): { provinceCode: string; cityCode: string | null; districtCode: string | null } {
  if (code.endsWith("0000")) return { provinceCode: code, cityCode: null, districtCode: null }
  return { provinceCode: `${code.slice(0, 2)}0000`, cityCode: code, districtCode: null }
}

export function PhotoWallDesktop({
  spots,
  geos = EMPTY_GEOS,
  layout = "page",
  onLocateSpot,
  galleryZIndex,
  initialProvinceCode = null,
  initialCityCode = null,
  camCode = null,
}: PhotoWallDesktopProps) {
  const primary = useAppStore((state) => state.themes.primary)

  const initialFilter = React.useMemo<PhotoFilter>(() => {
    if (camCode) return splitAdcode(camCode)
    return { provinceCode: initialProvinceCode, cityCode: initialCityCode, districtCode: null }
  }, [camCode, initialProvinceCode, initialCityCode])

  const [filter, setFilter] = React.useState<PhotoFilter>(initialFilter)
  const [gallery, setGallery] = React.useState<GalleryState | null>(null)
  const [locationQuery, setLocationQuery] = React.useState("")

  const sorted = React.useMemo(() => sortSpots(spots), [spots])
  const deferredLocationQuery = React.useDeferredValue(locationQuery.trim().toLowerCase())
  const visible = React.useMemo(() => {
    const regionSpots = filterSpots(sorted, filter)
    if (!deferredLocationQuery) return regionSpots
    return regionSpots.filter((spot) => spot.title.toLowerCase().includes(deferredLocationQuery))
  }, [sorted, filter, deferredLocationQuery])
  const groups = React.useMemo(() => groupSpots(visible), [visible])

  const countryGeo = geos["100000"] ?? null
  const cityGeo = filter.provinceCode ? geos[filter.provinceCode] ?? null : null

  const countryCounts = React.useMemo(() => countByRegion(sorted).province, [sorted])
  const cityCounts = React.useMemo(() => {
    const scoped = sorted.filter((spot) => spot.provinceCode === filter.provinceCode)
    return countByRegion(scoped).city
  }, [sorted, filter.provinceCode])

  const cities = React.useMemo(() => {
    if (!filter.provinceCode) return []
    return collectCities(sorted, filter.provinceCode).map((city) => ({
      ...city,
      count: cityCounts.get(city.code) ?? 0,
    }))
  }, [sorted, filter.provinceCode, cityCounts])

  const provinces = React.useMemo(() => collectProvinces(sorted), [sorted])
  const regionValueLabelMap = React.useMemo(() => {
    const labels: Record<string, string> = {}
    for (const spot of sorted) {
      labels[spot.provinceCode] = spot.provinceName
      labels[spot.cityCode] = spot.cityName
      if (spot.districtCode && spot.districtName) labels[spot.districtCode] = spot.districtName
    }
    return labels
  }, [sorted])

  /** 相机：设计稿阶段由 camCode 决定静态机位；P3 换成滚动/点击驱动 */
  const camera = React.useMemo<Camera>(() => {
    if (!countryGeo) return CAMERA_COUNTRY
    const target = filter.cityCode ?? filter.provinceCode
    if (!target) return CAMERA_COUNTRY

    if (filter.cityCode && cityGeo) {
      const mainFit = createMainFit(countryGeo, 18)
      const cityRegions = projectRegionsInFit(cityGeo, mainFit)
      const hit = cityRegions.find((region) => region.adcode === filter.cityCode)
      if (hit) return cameraFor(hit.bounds, { zoom: 1.25, max: 10 })
    }

    const countryRegions = projectRegions(countryGeo, MAP_VIEW.w, MAP_VIEW.h, 18)
    const hit = countryRegions.find((region) => region.adcode === filter.provinceCode)
    return hit ? cameraFor(hit.bounds) : CAMERA_COUNTRY
  }, [countryGeo, cityGeo, filter.provinceCode, filter.cityCode])

  const provinceName = React.useMemo(
    () => sorted.find((spot) => spot.provinceCode === filter.provinceCode)?.provinceName ?? null,
    [sorted, filter.provinceCode]
  )
  const cityName = React.useMemo(
    () => sorted.find((spot) => spot.cityCode === filter.cityCode)?.cityName ?? null,
    [sorted, filter.cityCode]
  )

  const handleSelectRegion = React.useCallback((region: { code: string; name: string }) => {
    if (region.code === "100000") return
    setFilter((prev) =>
      prev.provinceCode === null || region.code === prev.provinceCode
        ? { provinceCode: region.code, cityCode: null, districtCode: null }
        : { provinceCode: prev.provinceCode, cityCode: region.code, districtCode: null }
    )
  }, [])

  const handleReset = React.useCallback(() => {
    setFilter({ provinceCode: null, cityCode: null, districtCode: null })
    setLocationQuery("")
  }, [])

  const handleSelectFilterRegion = React.useCallback((path: string[]) => {
    setFilter({
      provinceCode: path[0] ?? null,
      cityCode: path[1] ?? null,
      districtCode: path[2] ?? null,
    })
  }, [])

  const handleJump = React.useCallback((code: string) => {
    setFilter({ provinceCode: code, cityCode: null, districtCode: null })
    document.getElementById(`pw-province-${code}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const handleOpen = React.useCallback(
    (spot: PhotoSpot, photoIndex: number) => {
      onLocateSpot?.(spot)
      setGallery({
        urls: spot.photos,
        index: photoIndex,
        meta: {
          provinceName: spot.provinceName,
          cityName: spot.cityName,
          districtName: spot.districtName,
        },
        uniqueId: `photo-wall-${spot.id}`,
      })
    },
    [onLocateSpot]
  )

  const closeGallery = React.useCallback(() => setGallery(null), [])
  const handleSelectLocation = React.useCallback(
    (spot: PhotoSpot) => {
      onLocateSpot?.(spot)
    },
    [onLocateSpot]
  )

  const isSidebar = layout === "sidebar"

  return (
    <div
      className={
        isSidebar
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "container pt-[calc(var(--header-height)+2rem)] pb-16"
      }
      style={photoWallStyle(primary)}
    >
      {isSidebar ? (
        <PhotoWallSidebarFilters
          locationQuery={locationQuery}
          onLocationQueryChange={setLocationQuery}
          regionPath={[filter.provinceCode, filter.cityCode, filter.districtCode].filter(
            (code): code is string => Boolean(code),
          )}
          regionValueLabelMap={regionValueLabelMap}
          onRegionChange={handleSelectFilterRegion}
        />
      ) : (
        <PhotoWallHeader
          photoCount={countPhotos(visible)}
          spotCount={visible.length}
          filtered={Boolean(filter.provinceCode || filter.cityCode || filter.districtCode)}
          onReset={handleReset}
          variant="desktop"
        />
      )}

      <div
        className={
          isSidebar
            ? "min-h-0 flex-1 overflow-y-auto px-4 pb-6"
            : "grid items-start gap-8 lg:grid-cols-[clamp(320px,34vw,400px)_minmax(0,1fr)]"
        }
      >
        {!isSidebar && (
          <div className="sticky top-[calc(var(--header-height)+24px)] space-y-4">
            <MapPanel
              countryGeo={countryGeo}
              cityGeo={cityGeo}
              camera={camera}
              counts={countryCounts}
              cityCounts={cityCounts}
              selectedCode={filter.cityCode ?? filter.provinceCode}
              activeProvinceCode={filter.provinceCode}
              provinceName={provinceName}
              cityName={cityName}
              cities={cities}
              onSelectRegion={handleSelectRegion}
              onSelectCity={(code) =>
                setFilter((prev) => ({
                  provinceCode: prev.provinceCode,
                  cityCode: prev.cityCode === code ? null : code,
                  districtCode: null,
                }))
              }
              onReset={handleReset}
              locked={Boolean(filter.provinceCode)}
            />

            <ProvinceRail
              className="hidden lg:block"
              provinces={provinces}
              activeCode={filter.provinceCode}
              onJump={handleJump}
            />
          </div>
        )}

        <SpotList
          groups={groups}
          variant="desktop"
          onOpen={handleOpen}
          onSelectLocation={onLocateSpot ? handleSelectLocation : undefined}
          onReset={handleReset}
          layoutIdPrefix="photo-wall"
          stickyHeadingTopClassName={isSidebar ? "top-0" : undefined}
          className={isSidebar ? "space-y-8" : undefined}
          emptyText={
            locationQuery.trim()
              ? `没有找到“${locationQuery.trim()}”相关地点`
              : filter.districtCode
              ? "这个地区还没有照片"
              : filter.cityCode
              ? "这个城市还没有照片"
              : filter.provinceCode
              ? "这个省份还没有照片"
              : "还没有照片足迹"
          }
        />
      </div>

      <GalleryModal
        isOpen={gallery !== null}
        urls={gallery?.urls ?? []}
        defaultIndex={gallery?.index}
        locationMeta={gallery?.meta}
        uniqueId={gallery?.uniqueId ?? "photo-wall"}
        zIndex={galleryZIndex}
        onBackdropClick={closeGallery}
        onCloseButtonClick={closeGallery}
      />
    </div>
  )
}
