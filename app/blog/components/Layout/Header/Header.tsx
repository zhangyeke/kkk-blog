"use client"
import {CSSProperties} from "react";
import {useSelectedLayoutSegments} from "next/navigation"
import {HEADER_BLACKS, HEADER_FIXED_WHITES} from "@/config/blog";
import {cn} from "@/lib/utils"

export default function Header({children, className, style}: ContainerProps & BaseComponentProps) {
    const segments = useSelectedLayoutSegments()
    const segment = segments[segments.length - 1] || '/'
    const isHide = HEADER_BLACKS.includes(segment)
    if (isHide) {
        return null
    }
    const fixedClassName = `fixed left-0 top-0 z-100`
    const isFixed = HEADER_FIXED_WHITES.includes(segment)
    return (
        <header
            style={style as CSSProperties}
            className={cn(`bg-black/25 ${isFixed ? fixedClassName : ''} w-full flex justify-between items-center px-15 h-15 `, className)}
        >
            {children}
        </header>
    )
}
