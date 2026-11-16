"use client"

import React from "react"
import { RotateCcw } from "lucide-react"

import { cn } from "@/lib/utils"

interface PhotoWallHeaderProps {
    photoCount: number
    spotCount: number
    filtered?: boolean
    onReset?: () => void
    variant?: "desktop" | "mobile"
    className?: string
}

/**
 * 字阶全部 400：Sara 只注册了 weight 400，用 font-semibold 会触发浏览器合成加粗（笔画发糊）。
 * 视觉重量靠字号级差补回来。
 */
export function PhotoWallHeader({
    photoCount,
    spotCount,
    filtered = false,
    onReset,
    variant = "desktop",
    className,
}: PhotoWallHeaderProps) {
    const isMobile = variant === "mobile"

    return (
        <header className={cn("flex items-end justify-between gap-4", isMobile ? "pb-5" : "pb-10", className)}>
            <div className="min-w-0">
                <p
                    className={cn(
                        "font-h1 uppercase text-[var(--pw-ink-3)]",
                        isMobile ? "text-[10px] tracking-[0.26em]" : "text-[11px] tracking-[0.28em]",
                    )}
                >
                    Travel Archive
                </p>
                <h1
                    className={cn(
                        "mt-2 text-[var(--pw-ink)]",
                        isMobile ? "text-[1.875rem] leading-[2.375rem]" : "text-[2.625rem] leading-[3.25rem]",
                    )}
                    style={{letterSpacing: "0.02em", textWrap: "balance"}}
                >
                    旅行照片墙
                </h1>
                <p
                    className={cn(
                        "mt-1 text-[var(--pw-ink-2)]",
                        isMobile ? "text-[13px] leading-[1.4rem]" : "text-[15px] leading-[1.625rem]",
                    )}
                    style={{letterSpacing: "0.06em"}}
                >
                    按地点收集的光影
                </p>
            </div>

            <div className={cn("shrink-0 text-right", isMobile ? "text-[10px]" : "text-[11px]")}>
                <p className="flex items-baseline justify-end gap-1.5">
                    <span
                        className={cn("font-h1 leading-none text-[var(--pw-ink)]", isMobile ? "text-2xl" : "text-[2.125rem]")}
                        style={{letterSpacing: "0.02em"}}
                    >
                        {photoCount}
                    </span>
                    <span className="tracking-[0.14em] text-[var(--pw-ink-3)]">张</span>
                    <span className="mx-0.5 text-[var(--pw-hair)]">/</span>
                    <span className="font-h1 text-[1.125rem] leading-none text-[var(--pw-ink-2)]">{spotCount}</span>
                    <span className="tracking-[0.14em] text-[var(--pw-ink-3)]">地点</span>
                </p>

                {filtered && onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        className={cn(
                            "mt-2 inline-flex items-center gap-1 text-[11px] tracking-[0.08em]",
                            "text-[var(--pw-ink-3)] transition-colors hover:text-foreground",
                        )}
                    >
                        <RotateCcw className="size-3"/>
                        重置筛选
                    </button>
                )}
            </div>
        </header>
    )
}
