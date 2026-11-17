"use client"

import React from "react"

import { Empty } from "@/components/k-view/Empty"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/ui/cn"
import type { PhotoProvinceGroup, PhotoSpot } from "@/types/photo-wall"
import { SpotCard } from "./SpotCard"

interface SpotListProps {
    groups: PhotoProvinceGroup[]
    variant: "desktop" | "mobile"
    onOpen?: (spot: PhotoSpot, photoIndex: number) => void
    onSelectLocation?: (spot: PhotoSpot) => void
    onReset?: () => void
    emptyText?: string
    /** 桌面端给卡片传 layoutId 前缀，与灯箱共享放大 */
    layoutIdPrefix?: string
    /** 滚动列表中的省标题吸顶位置。 */
    stickyHeadingTopClassName?: string
    className?: string
}

export function SpotList({
    groups,
    variant,
    onOpen,
    onSelectLocation,
    onReset,
    emptyText = "这个城市还没有照片",
    layoutIdPrefix,
    stickyHeadingTopClassName,
    className,
}: SpotListProps) {
    const isMobile = variant === "mobile"

    if (groups.length === 0) {
        return (
            <div className={cn("flex flex-col items-center gap-3 py-20", className)}>
                <Empty type="imagePlaceholder" text={emptyText}/>
                {onReset && (
                    <Button type="button" variant="outline" size="sm" onClick={onReset}>
                        清除筛选
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className={cn(isMobile ? "space-y-12" : "space-y-16", className)}>
            {groups.map((province, provinceIndex) => (
                <section
                    key={province.provinceCode}
                    id={`pw-province-${province.provinceCode}`}
                    className="scroll-mt-[calc(var(--header-height)+3rem)]"
                >
                    {/* 省分组头：序号用 DripOctober，靠字号而不是字重建立层级 */}
                    <h2
                        className={cn(
                            "sticky z-10 flex items-baseline gap-2.5 bg-background py-2",
                            stickyHeadingTopClassName ?? (isMobile
                                ? "top-[calc(var(--header-height)+56px)]"
                                : "top-[calc(var(--header-height)+8px)]"),
                        )}
                        style={{borderBottom: "1px solid var(--pw-hair)"}}
                    >
                        <span
                            aria-hidden
                            className={cn("font-h1 leading-none", isMobile ? "text-[1.5rem]" : "text-[2.25rem]")}
                            style={{
                                letterSpacing: "0.02em",
                                color: "color-mix(in oklab, var(--pw-primary, #e6c99f) 46%, var(--background))",
                            }}
                        >
                            {String(provinceIndex + 1).padStart(2, "0")}
                        </span>
                        <span
                            className={cn("text-[var(--pw-ink)]", isMobile ? "text-[1.125rem]" : "text-[1.375rem]")}
                            style={{letterSpacing: "0.03em"}}
                        >
                            {province.provinceName}
                        </span>
                        <span
                            className="text-[11px] tabular-nums text-[var(--pw-ink-3)]"
                            style={{letterSpacing: "0.08em"}}
                        >
                            {province.spotCount} 个地点 · {province.photoCount} 张
                        </span>
                    </h2>

                    <div className={cn(isMobile ? "mt-5 space-y-10" : "mt-6 space-y-12")}>
                        {province.cities.map((city) => (
                            <div key={city.cityCode}>
                                <h3
                                    className="mb-3 text-[12px] text-[var(--pw-ink-3)]"
                                    style={{letterSpacing: "0.1em"}}
                                >
                                    {city.cityName}
                                </h3>
                                <div className={cn(isMobile ? "space-y-9" : "space-y-10")}>
                                    {city.spots.map((spot, index) => (
                                        <SpotCard
                                            key={spot.id}
                                            spot={spot}
                                            variant={variant}
                                            index={index}
                                            onOpen={onOpen}
                                            onSelectLocation={onSelectLocation}
                                            layoutId={layoutIdPrefix ? `${layoutIdPrefix}-${spot.id}` : undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
