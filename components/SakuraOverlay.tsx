"use client"

import { useEffect, useId, useRef } from "react"
import "sakura-js/dist/sakura.min.css"
import Sakura from "sakura-js/dist/sakura.js"
import type { SakuraCtorOptions } from "sakura-js/dist/sakura.js"

export type SakuraOverlayProps = Omit<SakuraCtorOptions, "className"> & {
  /** 覆盖层容器 className（固定全屏、不拦截点击） */
  wrapperClassName?: string
  /** 对应 sakura-js 的 `className`：花瓣节点的 class（默认可不传，使用库自带 CSS） */
  petalClassName?: string
}

/**
 * 全屏樱花飘落（sakura-js），仅客户端挂载；卸载时停止并清理花瓣。
 */
export default function SakuraOverlay({
  wrapperClassName = "",
  petalClassName,
  fallSpeed,
  maxSize,
  minSize,
  delay,
  colors,
}: SakuraOverlayProps) {
  const rootId = `sakura-root-${useId().replace(/:/g, "")}`
  const instanceRef = useRef<Sakura | null>(null)
  const colorsJson = JSON.stringify(colors ?? null)

  useEffect(() => {
    const opts: SakuraCtorOptions = {}
    if (petalClassName != null) opts.className = petalClassName
    if (fallSpeed != null) opts.fallSpeed = fallSpeed
    if (maxSize != null) opts.maxSize = maxSize
    if (minSize != null) opts.minSize = minSize
    if (delay != null) opts.delay = delay
    if (colors != null) opts.colors = colors

    if (!document.getElementById(rootId)) return

    instanceRef.current = new Sakura(`#${CSS.escape(rootId)}`, opts)
    return () => {
      instanceRef.current?.stop(false)
      instanceRef.current = null
    }
  }, [
    rootId,
    petalClassName,
    fallSpeed,
    maxSize,
    minSize,
    delay,
    colorsJson,
  ])

  return (
    <div
      id={rootId}
      className={`pointer-events-none fixed inset-0 z-60 overflow-x-hidden ${wrapperClassName}`.trim()}
      aria-hidden
    />
  )
}
