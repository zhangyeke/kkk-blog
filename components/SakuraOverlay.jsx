/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-29 17:01:05
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-03 18:35:50
 * @FilePath: \blog\components\SakuraOverlay.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"

import { useEffect } from "react"
import Sakura from "@/lib/sakura"
import "@/styles/sakura.css"

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
}) {
  const colorsJson = JSON.stringify(colors ?? null)

  useEffect(() => {
    console.log(`Sakura`, Sakura)

    const opts = {}
    if (petalClassName != null) opts.className = petalClassName
    if (fallSpeed != null) opts.fallSpeed = fallSpeed
    if (maxSize != null) opts.maxSize = maxSize
    if (minSize != null) opts.minSize = minSize
    if (delay != null) opts.delay = delay
    if (colors != null) opts.colors = colors

    let instance = null
    let cancelled = false

    void (async () => {
      try {
        instance = new Sakura(".blog-layout", opts)
        console.log(`instance`, instance);
        if (cancelled) {
          instance.stop(true)
          instance = null
        }
      } catch (e) {
        console.error("[SakuraOverlay]", e)
      }
    })()

    return () => {
      cancelled = true
      instance?.stop(true)
      instance = null
    }
  }, [petalClassName, fallSpeed, maxSize, minSize, delay, colorsJson])

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-60 overflow-x-hidden ${wrapperClassName}`.trim()}
      aria-hidden
    />
  )
}
