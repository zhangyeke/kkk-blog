/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-29 17:01:05
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-04 18:26:14
 * @FilePath: \blog\components\SakuraOverlay.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"

import { useEffect } from "react"
import { merge } from "lodash"
import Sakura from "@/lib/sakura"
import "@/styles/sakura.css"

/**
 * @typedef {object} SakuraOverlayProps
 * @property {string} [wrapperClassName]
 * @property {string} [petalClassName]
 * @property {number} [fallSpeed]
 * @property {number} [maxSize]
 * @property {number} [minSize]
 * @property {number} [delay]
 * @property {unknown} [colors] sakura-js 可选项；库内与渐变等配置有关
 */

/**
 * 全屏樱花飘落（sakura-js），仅客户端挂载；卸载时停止并清理花瓣。
 * 使用动态 import，避免 Turbopack/Webpack 对 sakura.js 顶层 default + `new` 的错误压缩形态（i.default is not a constructor）。
 * @param {SakuraOverlayProps} props
 */
export default function SakuraOverlay({ className = "", ...props }) {
  useEffect(() => {
    const opts = merge({}, props)
    let instance = null
    let cancelled = false

    void (async () => {
      try {
        instance = new Sakura(".sakura-overlay", opts)
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
  }, [props])

  return <div className={`sakura-overlay pointer-events-none fixed inset-0 z-60 overflow-x-hidden ${className}`.trim()} aria-hidden />
}
