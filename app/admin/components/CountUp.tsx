"use client"

import React from "react"
import { animate, useReducedMotion } from "motion/react"

/**
 * 数字滚动。用 motion 的 animate 驱动一个 ref 上的 textContent，
 * 不触发 React 重渲染——列表里有十几个数字时差别很明显。
 */
export function CountUp({
    value,
    suffix = "",
    duration = 0.9,
    className,
    style,
}: {
    value: number
    suffix?: string
    duration?: number
    className?: string
    style?: React.CSSProperties
}) {
    const ref = React.useRef<HTMLSpanElement>(null)
    const reduce = useReducedMotion()

    React.useEffect(() => {
        const node = ref.current
        if (!node) return

        const format = (n: number) => n.toLocaleString("en-US") + suffix

        if (reduce) {
            node.textContent = format(value)
            return
        }

        const controls = animate(0, value, {
            duration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (latest) => {
                node.textContent = format(Math.round(latest))
            },
        })
        return () => controls.stop()
    }, [value, suffix, duration, reduce])

    return (
        <span ref={ref} className={className} style={style}>
            0{suffix}
        </span>
    )
}
