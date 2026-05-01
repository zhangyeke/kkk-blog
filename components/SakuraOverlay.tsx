"use client"

import { useEffect, useId } from "react"
import "sakura-js/dist/sakura.min.css"
import type { SakuraCtorOptions } from "sakura-js/dist/sakura.js"

export type SakuraOverlayProps = Omit<SakuraCtorOptions, "className"> & {
  /** 覆盖层容器 className（固定全屏、不拦截点击） */
  wrapperClassName?: string
  /** 对应 sakura-js 的 `className`：花瓣节点的 class（默认可不传，使用库自带 CSS） */
  petalClassName?: string
}

type SakuraInstance = { stop: (graceful?: boolean) => void }

/** sakura-js 为 UMD/CJS，生产包 default 互操作可能不是可 new 的函数，需兼容多种导出形态 */
function resolveSakuraConstructor(
  mod: unknown,
): new (selector: string, options?: SakuraCtorOptions) => SakuraInstance {
  if (typeof mod === "function") {
    return mod as new (selector: string, options?: SakuraCtorOptions) => SakuraInstance
  }
  if (mod !== null && typeof mod === "object" && "default" in mod) {
    const d = (mod as { default: unknown }).default
    if (typeof d === "function") {
      return d as new (selector: string, options?: SakuraCtorOptions) => SakuraInstance
    }
  }
  throw new TypeError(
    "[SakuraOverlay] sakura-js：未解析到构造函数（生产包 ESM/CJS 互操作问题）",
  )
}

/**
 * 全屏樱花飘落（sakura-js），仅客户端挂载；卸载时停止并清理花瓣。
 * 使用动态 import，避免 Turbopack/Webpack 对 sakura.js 顶层 default + `new` 的错误压缩形态（i.default is not a constructor）。
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
  const colorsJson = JSON.stringify(colors ?? null)

  useEffect(() => {
    const opts: SakuraCtorOptions = {}
    if (petalClassName != null) opts.className = petalClassName
    if (fallSpeed != null) opts.fallSpeed = fallSpeed
    if (maxSize != null) opts.maxSize = maxSize
    if (minSize != null) opts.minSize = minSize
    if (delay != null) opts.delay = delay
    if (colors != null) opts.colors = colors

    let instance: SakuraInstance | null = null
    let cancelled = false

    void (async () => {
      try {
        const mod = await import("sakura-js/dist/sakura.js")
        if (cancelled) return
        if (!document.getElementById(rootId)) return
        const Ctor = resolveSakuraConstructor(mod)
        if (cancelled) return
        instance = new Ctor(`#${CSS.escape(rootId)}`, opts)
        if (cancelled) {
          instance.stop(false)
          instance = null
        }
      } catch (e) {
        console.error("[SakuraOverlay]", e)
      }
    })()

    return () => {
      cancelled = true
      instance?.stop(false)
      instance = null
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
