"use client"

import React from "react"

import { cn } from "@/lib/utils"

interface ProvinceRailProps {
    provinces: Array<{ code: string; name: string }>
    activeCode: string | null
    onJump: (code: string) => void
    className?: string
}

/**
 * 省份进度轨：1px 竖线 + 每省一个刻度。
 * 当前省的刻度延长成短横并染成主色，给"这是一段叙事"提供空间锚点。
 */
export function ProvinceRail({provinces, activeCode, onJump, className}: ProvinceRailProps) {
    if (provinces.length < 2) return null

    return (
        <nav aria-label="省份进度" className={cn("relative pl-1", className)}>
            <span
                aria-hidden
                className="absolute bottom-1.5 left-[3px] top-1.5 w-px"
                style={{background: "var(--pw-hair)"}}
            />
            <ul className="relative flex flex-col gap-3">
                {provinces.map((province) => {
                    const active = province.code === activeCode
                    return (
                        <li key={province.code}>
                            <button
                                type="button"
                                aria-current={active ? "true" : undefined}
                                onClick={() => onJump(province.code)}
                                className="group flex w-full items-center gap-2.5 py-0.5 text-left"
                            >
                                <span
                                    className={cn(
                                        "h-px shrink-0 transition-all duration-300",
                                        active ? "w-3" : "w-1.5 group-hover:w-2.5",
                                    )}
                                    style={{
                                        background: active
                                            ? "var(--pw-primary, #e6c99f)"
                                            : "color-mix(in oklab, var(--foreground) 22%, transparent)",
                                    }}
                                />
                                <span
                                    className={cn(
                                        "truncate text-[11px] transition-colors",
                                        active ? "text-foreground" : "text-[var(--pw-ink-3)] group-hover:text-foreground",
                                    )}
                                    style={{letterSpacing: "0.08em"}}
                                >
                                    {province.name}
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
