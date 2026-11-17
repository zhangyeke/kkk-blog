"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

import type { ChinaGeoJSON } from "@/types/china-map"
import { Spinner } from "@/components/k-view/Loader/Spinner"
import { cn } from "@/lib/ui/cn"
import { type Camera, CAMERA_COUNTRY } from "./geo-projection"
import { PhotoWallMap } from "./PhotoWallMap"
import { PW_GRAIN } from "./tokens"
import { useElementWidth } from "./use-element-width"

interface MapPanelProps {
    countryGeo: ChinaGeoJSON | null
    cityGeo?: ChinaGeoJSON | null
    camera?: Camera
    counts: Map<string, number>
    cityCounts?: Map<string, number>
    selectedCode: string | null
    activeProvinceCode?: string | null
    provinceName?: string | null
    cityName?: string | null
    cities: Array<{ code: string; name: string; count: number }>
    onSelectRegion: (region: { code: string; name: string }) => void
    onSelectCity: (code: string) => void
    onReset: () => void
    /** 双轨交互：相机是跟随滚动还是被点击锁定 */
    locked?: boolean
    loading?: boolean
}

export function MapPanel({
    countryGeo,
    cityGeo = null,
    camera = CAMERA_COUNTRY,
    counts,
    cityCounts,
    selectedCode,
    activeProvinceCode = null,
    provinceName,
    cityName,
    cities,
    onSelectRegion,
    onSelectCity,
    onReset,
    locked = false,
    loading = false,
}: MapPanelProps) {
    const {ref, width} = useElementWidth<HTMLDivElement>()

    return (
        <div
            className={cn("relative overflow-hidden rounded-xl p-4")}
            style={{
                background: "var(--pw-paper)",
                border: "1px solid var(--pw-hair)",
                boxShadow: "var(--pw-shadow-1), var(--pw-rim)",
            }}
        >
            {/* 颗粒噪点：只在这一张卡上，不铺全屏 */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply dark:mix-blend-screen dark:opacity-[0.08]"
                style={{backgroundImage: PW_GRAIN, backgroundSize: "160px 160px"}}
            />

            <div className="relative">
                {/* 层级 + 返回 */}
                <div className="flex h-8 items-center justify-between gap-2">
                    <nav aria-label="当前筛选" className="flex min-w-0 items-center gap-1 text-[13px]">
                        <button
                            type="button"
                            onClick={onReset}
                            className={cn(
                                "truncate transition-colors",
                                provinceName ? "text-muted-foreground hover:text-foreground" : "text-foreground",
                            )}
                        >
                            中国
                        </button>
                        {provinceName && (
                            <>
                                <ChevronRight className="size-3 shrink-0 text-[var(--pw-hair)]"/>
                                <span
                                    className={cn(
                                        "truncate",
                                        cityName ? "text-muted-foreground" : "text-foreground",
                                    )}
                                >
                                    {provinceName}
                                </span>
                            </>
                        )}
                        {cityName && (
                            <>
                                <ChevronRight className="size-3 shrink-0 text-[var(--pw-hair)]"/>
                                <span className="truncate text-foreground">{cityName}</span>
                            </>
                        )}
                    </nav>

                    {provinceName && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="shrink-0 text-[11px] tracking-[0.06em] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                        >
                            返回全国
                        </button>
                    )}
                </div>

                {/* 地图 */}
                <div ref={ref} className="relative mt-1">
                    {loading || !countryGeo ? (
                        <div className="flex aspect-[1000/720] items-center justify-center rounded-lg bg-muted/40">
                            <Spinner text="地图加载中"/>
                        </div>
                    ) : (
                        <PhotoWallMap
                            countryGeo={countryGeo}
                            cityGeo={cityGeo}
                            camera={camera}
                            counts={counts}
                            cityCounts={cityCounts}
                            selectedCode={selectedCode}
                            activeProvinceCode={activeProvinceCode}
                            onSelect={onSelectRegion}
                            renderedWidth={width}
                        />
                    )}
                </div>

                {/* HUD：缩放读数 + 跟随/锁定状态，强化工具感 */}
                <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-h1 text-[11px] tracking-[0.14em] text-[var(--pw-ink-3)]">
                            ×{camera.scale.toFixed(2)}
                        </span>
                        <span
                            className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px] tracking-[0.1em]",
                                locked
                                    ? "bg-[color-mix(in_oklab,var(--pw-primary,#e6c99f)_22%,transparent)] text-foreground"
                                    : "text-[var(--pw-ink-3)]",
                            )}
                        >
                            {locked ? "已锁定" : "跟随滚动"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--pw-ink-3)]">
                        <span className="flex items-center gap-1.5">
                            <i className="size-2 rounded-[2px] bg-[color-mix(in_oklab,var(--pw-primary,#e6c99f)_45%,var(--muted))]"/>
                            有照片
                        </span>
                        <span className="flex items-center gap-1.5">
                            <i className="size-2 rounded-[2px] bg-muted opacity-50"/>
                            暂无
                        </span>
                    </div>
                </div>

                {/* 城市 chips（推近到省时出现） */}
                {cities.length > 0 && (
                    <div
                        className="mt-3 flex flex-wrap gap-1.5 pt-3"
                        style={{borderTop: "1px solid var(--pw-hair)"}}
                    >
                        {cities.map((city) => {
                            const active = city.code === selectedCode
                            return (
                                <button
                                    key={city.code}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => onSelectCity(city.code)}
                                    className={cn(
                                        "h-7 rounded-full px-2.5 text-[11px] transition-colors",
                                        active
                                            ? "bg-[color-mix(in_oklab,var(--pw-primary,#e6c99f)_20%,transparent)] text-foreground"
                                            : "text-[var(--pw-ink-3)] hover:text-foreground",
                                    )}
                                    style={{
                                        border: `1px solid ${active ? "color-mix(in oklab, var(--pw-primary,#e6c99f) 45%, transparent)" : "var(--pw-hair)"}`,
                                    }}
                                >
                                    {city.name}
                                    <span className="ml-1 tabular-nums opacity-60">{city.count}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
