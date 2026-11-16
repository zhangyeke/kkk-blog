"use client"

import React from "react"

/** 量出元素实际宽度，用于把 SVG viewBox 里的字号反算成真实 px */
export function useElementWidth<T extends HTMLElement>(fallback = 340) {
    const ref = React.useRef<T>(null)
    const [width, setWidth] = React.useState(fallback)

    React.useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const next = entries[0]?.contentRect.width
            if (next) setWidth(next)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return {ref, width}
}
