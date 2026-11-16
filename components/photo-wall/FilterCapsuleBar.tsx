"use client"

import React from "react"
import { Map } from "lucide-react"

import { cn } from "@/lib/utils"

interface FilterCapsuleBarProps {
    provinces: Array<{ code: string; name: string; count: number }>
    provinceCode: string | null
    cities: Array<{ code: string; name: string; count: number }>
    cityCode: string | null
    onSelectProvince: (code: string | null) => void
    onSelectCity: (code: string | null) => void
    onOpenMap: () => void
}

const CHIP_BASE =
    "h-8 shrink-0 snap-start rounded-full border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"

export function FilterCapsuleBar({
    provinces,
    provinceCode,
    cities,
    cityCode,
    onSelectProvince,
    onSelectCity,
    onOpenMap,
}: FilterCapsuleBarProps) {
    return (
        <div
            className={cn(
                "sticky z-40 -mx-4 px-4 py-2",
                "bg-background/85 backdrop-blur-md",
                "top-[var(--header-height)]",
            )}
        >
            {/* 省 chips + 地图按钮 */}
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "flex flex-1 gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory",
                        "[mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-28px),transparent)]",
                    )}
                    role="group"
                    aria-label="按省份筛选"
                >
                    <button
                        type="button"
                        aria-pressed={provinceCode === null}
                        onClick={() => onSelectProvince(null)}
                        className={cn(
                            CHIP_BASE,
                            provinceCode === null
                                ? "border-primary/60 bg-primary/20 text-foreground ring-1 ring-primary/40"
                                : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                        )}
                    >
                        全部
                    </button>
                    {provinces.map((province) => {
                        const active = province.code === provinceCode
                        return (
                            <button
                                key={province.code}
                                type="button"
                                aria-pressed={active}
                                onClick={() => onSelectProvince(active ? null : province.code)}
                                className={cn(
                                    CHIP_BASE,
                                    active
                                        ? "border-primary/60 bg-primary/20 text-foreground ring-1 ring-primary/40"
                                        : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                                )}
                            >
                                {province.name}
                                <span className="ml-1 tabular-nums opacity-60">{province.count}</span>
                            </button>
                        )
                    })}
                </div>

                <button
                    type="button"
                    onClick={onOpenMap}
                    className={cn(
                        "flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs",
                        "border-primary/40 bg-primary/15 text-foreground",
                        "transition-colors hover:bg-primary/25",
                    )}
                >
                    <Map className="size-3.5"/>
                    地图
                </button>
            </div>

            {/* 城市行：固定高度常驻，避免选中省份时列表整体跳动 */}
            <div className="mt-2 flex h-8 items-center">
                {provinceCode === null ? (
                    <p className="text-xs text-muted-foreground">选择省份后可按城市筛选</p>
                ) : (
                    <div
                        className={cn(
                            "flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory",
                            "[mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)]",
                        )}
                        role="group"
                        aria-label="按城市筛选"
                    >
                        <button
                            type="button"
                            aria-pressed={cityCode === null}
                            onClick={() => onSelectCity(null)}
                            className={cn(
                                CHIP_BASE,
                                cityCode === null
                                    ? "border-foreground/25 bg-muted text-foreground"
                                    : "border-border text-muted-foreground hover:text-foreground",
                            )}
                        >
                            全部城市
                        </button>
                        {cities.map((city) => {
                            const active = city.code === cityCode
                            return (
                                <button
                                    key={city.code}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => onSelectCity(active ? null : city.code)}
                                    className={cn(
                                        CHIP_BASE,
                                        active
                                            ? "border-foreground/25 bg-muted text-foreground"
                                            : "border-border text-muted-foreground hover:text-foreground",
                                    )}
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
