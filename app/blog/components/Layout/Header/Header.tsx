"use client"
import {useSelectedLayoutSegments} from "next/navigation"
import {useMount, useWindowScroll} from "react-use";
import {HEADER_BLACKS, HEADER_FIXED_WHITES} from "@/config/blog";
import {cn} from "@/lib/utils"

import {useClientMounted} from "@/hooks"

function Header({children, className, style}: ContainerProps & BaseComponentProps) {
    const segments = useSelectedLayoutSegments()
    const segment = segments[segments.length - 1] || '/'
    const isMounted = useClientMounted()
    const isHide = HEADER_BLACKS.includes(segment)
    const {y} = useWindowScroll();
    const fixedClassName = `fixed left-0 top-0 `
    // const isFixed = HEADER_FIXED_WHITES.includes(segment)
    const isFixed = true


    if (isHide || !isMounted) {
        return null
    }
    return (
        <header
            style={style}
            className={cn(`text-base bg-background/50 z-[300] w-full flex justify-between items-center px-15 h-15 ${isFixed ? fixedClassName : ''} ${y >= 200 ? 'shadow-md shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_10px_rgba(0,0,0,0.5)]   fancy-nav-mask ' : ''}`, className)}
        >

            {children}
        </header>
    )
}

export default Header
