"use client"

import React from "react"

import type { ChinaGeoJSON } from "@/types/china-map"
import { cn } from "@/lib/utils"
import {
    applyCamera,
    type Camera,
    CAMERA_COUNTRY,
    createMainFit,
    MAP_INSET_BOX,
    MAP_VIEW,
    type ProjectedRegion,
    projectRegions,
    projectRegionsInFit,
} from "./geo-projection"

export type MapLevel = "country" | "province"

interface PhotoWallMapProps {
    /** 全国 geo：永远是底图，推近时也不卸载 */
    countryGeo: ChinaGeoJSON
    /** 当前省份的市级 geo；有值时叠加为「省市层」 */
    cityGeo?: ChinaGeoJSON | null
    /** 相机位；设计稿阶段由 `?cam=` 传静态值 */
    camera?: Camera
    /** 省 adcode → 照片数 */
    counts: Map<string, number>
    /** 市 adcode → 照片数（省市层用） */
    cityCounts?: Map<string, number>
    selectedCode: string | null
    /** 当前推近到的省，用于压暗其他省 */
    activeProvinceCode?: string | null
    onSelect: (region: { code: string; name: string }) => void
    /** 地图渲染宽度，用于把字号反算成 viewBox 单位 */
    renderedWidth?: number
    className?: string
}

/** 省名去掉行政后缀，地图上更省地方 */
function shortName(name: string): string {
    return name
        .replace(/(维吾尔|壮族|回族)?自治区$/u, "")
        .replace(/特别行政区$/u, "")
        .replace(/[省市]$/u, "")
}

export function PhotoWallMap({
    countryGeo,
    cityGeo = null,
    camera = CAMERA_COUNTRY,
    counts,
    cityCounts,
    selectedCode,
    activeProvinceCode = null,
    onSelect,
    renderedWidth = 368,
    className,
}: PhotoWallMapProps) {
    const countryRegions = React.useMemo(
        () => projectRegions(countryGeo, MAP_VIEW.w, MAP_VIEW.h, 18),
        [countryGeo],
    )

    const mainFit = React.useMemo(() => createMainFit(countryGeo, 18), [countryGeo])

    // 省市层必须复用全国 fit，才能和底图严丝合缝
    const cityRegions = React.useMemo(
        () => (cityGeo ? projectRegionsInFit(cityGeo, mainFit) : []),
        [cityGeo, mainFit],
    )

    /**
     * 标签层**不参与相机 transform**：位置按相机换算，字号用 viewBox 单位固定，
     * 所以推近 4× 后标签视觉尺寸不变（12px）。这样就不需要逐帧反缩放。
     */
    const labelSize = React.useMemo(
        () => Math.min(36, Math.max(15, (12 * MAP_VIEW.w) / Math.max(renderedWidth, 1))),
        [renderedWidth],
    )

    const transform = `translate(${camera.x} ${camera.y}) scale(${camera.scale})`
    const dimmed = Boolean(cityGeo) && camera.scale > 1.4

    const baseRegions = countryRegions.filter((region) => !region.inset)
    const insets = countryRegions.filter((region) => region.inset)

    const countryLabels = React.useMemo(() => {
        if (camera.scale > 1.6) return []
        return baseRegions.filter(
            (region) => region.label && ((counts.get(region.adcode) ?? 0) > 0 || region.adcode === selectedCode),
        )
    }, [baseRegions, counts, selectedCode, camera.scale])

    const cityLabels = React.useMemo(() => {
        if (!cityRegions.length) return []
        return cityRegions.filter(
            (region) => region.label && ((cityCounts?.get(region.adcode) ?? 0) > 0 || region.adcode === selectedCode),
        )
    }, [cityRegions, cityCounts, selectedCode])

    const label = cityGeo ? "省内城市地图，点击城市筛选照片" : "中国地图，点击省份筛选照片"

    return (
        <svg
            viewBox={`0 0 ${MAP_VIEW.w} ${MAP_VIEW.h}`}
            className={cn("block w-full h-auto select-none", className)}
            role="group"
            aria-label={label}
        >
            {/* ① 全国层 */}
            <g transform={transform}>
                {baseRegions.map((region) => (
                    <RegionShape
                        key={region.adcode || region.name}
                        region={region}
                        selected={region.adcode === selectedCode}
                        count={counts.get(region.adcode) ?? 0}
                        dim={
                            dimmed && region.adcode !== activeProvinceCode && region.adcode !== selectedCode
                        }
                        onSelect={onSelect}
                    />
                ))}
            </g>

            {/* ② 省市层：同一个 transform，靠透明度淡入 */}
            <g
                transform={transform}
                className="transition-opacity duration-300 motion-reduce:transition-none"
                style={{opacity: cityGeo ? 1 : 0, pointerEvents: cityGeo ? "auto" : "none"}}
            >
                {cityRegions.map((region) => (
                    <RegionShape
                        key={region.adcode || region.name}
                        region={region}
                        selected={region.adcode === selectedCode}
                        count={cityCounts?.get(region.adcode) ?? 0}
                        onSelect={onSelect}
                    />
                ))}
            </g>

            {/* ③ 标签层：不随相机缩放，位置按相机换算 */}
            <g aria-hidden className="pointer-events-none">
                {countryLabels.map((region) => {
                    const pos = applyCamera(region.label!, camera)
                    return (
                        <text
                            key={region.adcode}
                            x={pos.x}
                            y={pos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="select-none fill-muted-foreground"
                            style={{
                                fontSize: labelSize,
                                letterSpacing: "0.04em",
                                stroke: "var(--background)",
                                strokeWidth: labelSize * 0.2,
                                paintOrder: "stroke",
                            }}
                        >
                            {shortName(region.name)}
                        </text>
                    )
                })}
                {cityLabels.map((region) => {
                    const pos = applyCamera(region.label!, camera)
                    return (
                        <text
                            key={`city-${region.adcode}`}
                            x={pos.x}
                            y={pos.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="select-none fill-foreground"
                            style={{
                                fontSize: labelSize,
                                letterSpacing: "0.04em",
                                stroke: "var(--background)",
                                strokeWidth: labelSize * 0.22,
                                paintOrder: "stroke",
                            }}
                        >
                            {shortName(region.name)}
                        </text>
                    )
                })}
            </g>

            {/* ④ 南海诸岛：国标插图，恒定 1:1 贴右下角，不参与相机 */}
            {insets.length > 0 && (
                <g aria-hidden className="pointer-events-none">
                    <rect
                        x={MAP_INSET_BOX.x}
                        y={MAP_INSET_BOX.y}
                        width={MAP_INSET_BOX.w}
                        height={MAP_INSET_BOX.h}
                        rx={4}
                        className="fill-none stroke-border"
                        strokeWidth={1}
                    />
                    {insets.map((region) => (
                        <path
                            key={region.adcode || "inset"}
                            d={region.d}
                            vectorEffect="non-scaling-stroke"
                            className="fill-muted stroke-border"
                            style={{strokeWidth: 1}}
                        />
                    ))}
                </g>
            )}
        </svg>
    )
}

interface RegionShapeProps {
    region: ProjectedRegion
    selected: boolean
    count: number
    dim?: boolean
    onSelect: (region: { code: string; name: string }) => void
}

function RegionShape({region, selected, count, dim = false, onSelect}: RegionShapeProps) {
    const hasPhotos = count > 0

    const handle = React.useCallback(() => {
        onSelect({code: region.adcode, name: region.name})
    }, [onSelect, region.adcode, region.name])

    const onKeyDown = React.useCallback(
        (event: React.KeyboardEvent<SVGGElement>) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handle()
            }
        },
        [handle],
    )

    return (
        <g
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={`${region.name}${hasPhotos ? `，${count} 张照片` : "，暂无照片"}`}
            onClick={handle}
            onKeyDown={onKeyDown}
            className="group cursor-pointer outline-none"
            style={{
                opacity: dim ? 0.32 : 1,
                transition: "opacity 240ms cubic-bezier(.16,1,.3,1)",
            }}
        >
            <path
                d={region.d}
                vectorEffect="non-scaling-stroke"
                className={cn(
                    "transition-[fill] duration-200 group-focus-visible:stroke-[3]",
                    hasPhotos
                        ? "fill-[color-mix(in_oklab,var(--pw-primary,#e6c99f)_45%,var(--muted))] stroke-[color-mix(in_oklab,var(--pw-primary,#e6c99f)_55%,var(--border))]"
                        : "fill-muted stroke-border",
                )}
                style={{strokeWidth: 1}}
            />
            <path
                d={region.d}
                vectorEffect="non-scaling-stroke"
                className="pointer-events-none fill-[var(--pw-primary,#e6c99f)] opacity-0 transition-opacity duration-150 group-hover:opacity-20 group-focus-visible:opacity-20"
                style={selected ? {opacity: 0.55} : undefined}
            />
        </g>
    )
}
