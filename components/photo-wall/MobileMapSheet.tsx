"use client"

import React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { X } from "lucide-react"

import type { ChinaGeoJSON } from "@/types/china-map"
import { cn } from "@/lib/ui/cn"
import { PhotoWallMap } from "./PhotoWallMap"
import { useElementWidth } from "./use-element-width"

interface MobileMapSheetProps {
    open: boolean
    onClose: () => void
    geo: ChinaGeoJSON | null
    level: "country" | "province"
    provinceName?: string | null
    cityName?: string | null
    selectedCode: string | null
    counts: Map<string, number>
    cities: Array<{ code: string; name: string; count: number }>
    onSelectRegion: (region: { code: string; name: string }) => void
    onSelectCity: (code: string | null) => void
    onReset: () => void
}

export function MobileMapSheet({
    open,
    onClose,
    geo,
    level,
    provinceName,
    cityName,
    selectedCode,
    counts,
    cities,
    onSelectRegion,
    onSelectCity,
    onReset,
}: MobileMapSheetProps) {
    const reduceMotion = useReducedMotion()
    const {ref, width} = useElementWidth<HTMLDivElement>(360)

    // 打开时锁住背景滚动
    React.useEffect(() => {
        if (!open) return
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = previous
        }
    }, [open])

    // Esc 关闭
    React.useEffect(() => {
        if (!open) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    const title = cityName ? `${provinceName} · ${cityName}` : provinceName ?? "选择地区"

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[400]" role="dialog" aria-modal="true" aria-label="按地区筛选照片">
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: reduceMotion ? 0.1 : 0.2}}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={reduceMotion ? {opacity: 0} : {y: "100%"}}
                        animate={reduceMotion ? {opacity: 1} : {y: 0}}
                        exit={reduceMotion ? {opacity: 0} : {y: "100%"}}
                        transition={
                            reduceMotion
                                ? {duration: 0.12}
                                : {type: "spring", stiffness: 380, damping: 34, mass: 0.9}
                        }
                        drag={reduceMotion ? false : "y"}
                        dragConstraints={{top: 0, bottom: 0}}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 96 || info.velocity.y > 500) onClose()
                        }}
                        className={cn(
                            "absolute inset-x-0 top-0 bottom-0 flex flex-col",
                            "bg-background shadow-2xl",
                        )}
                    >
                        {/* 顶栏：可拖拽把手 + 标题 + 关闭 */}
                        <div className="shrink-0 cursor-grab active:cursor-grabbing">
                            <div className="flex justify-center pt-2">
                                <span className="h-1 w-9 rounded-full bg-border"/>
                            </div>
                            <div className="flex h-12 items-center justify-between px-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="关闭地图"
                                    className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="size-4"/>
                                </button>
                                <span className="truncate text-sm font-medium text-foreground">{title}</span>
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="shrink-0 px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    清除
                                </button>
                            </div>
                        </div>

                        {/* 地图：垂直居中，避免下半屏大片留白 */}
                        <div ref={ref} className="flex flex-1 items-center justify-center overflow-y-auto px-3 pb-2">
                            {geo ? (
                                <PhotoWallMap
                                    countryGeo={geo}
                                    selectedCode={selectedCode}
                                    counts={counts}
                                    onSelect={onSelectRegion}
                                    renderedWidth={width}
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                    地图加载中…
                                </div>
                            )}
                        </div>

                        {/* 底部城市 chips */}
                        {level === "province" && cities.length > 0 && (
                            <div className="shrink-0 border-t border-border px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {cities.map((city) => {
                                        const active = city.code === selectedCode
                                        return (
                                            <button
                                                key={city.code}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() => onSelectCity(active ? null : city.code)}
                                                className={cn(
                                                    "h-8 shrink-0 rounded-full border px-3 text-xs transition-colors",
                                                    active
                                                        ? "border-primary/60 bg-primary/20 text-foreground ring-1 ring-primary/40"
                                                        : "border-border text-muted-foreground",
                                                )}
                                            >
                                                {city.name}
                                                <span className="ml-1 tabular-nums opacity-60">{city.count}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
