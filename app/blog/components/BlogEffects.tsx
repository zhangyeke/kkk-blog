"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useAppStore } from "@/hooks"
import FallingOverlay from "@/components/FallingSettings/FallingOverlay"

const SplashCursor = dynamic(() => import("@/components/bits/SplashCursor"), { ssr: false })

/** Starts the global falling effect and keeps the mouse trail scoped to the blog. */
export default function BlogEffects() {
  const pathname = usePathname()
  const { trackMouse } = useAppStore((state) => state)
  const [gates, setGates] = useState({ falling: false, cursor: false, visible: false })

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let cursorReady = false
    const sync = () => setGates({
      falling: document.readyState === "complete" && !motion.matches,
      cursor: cursorReady && !motion.matches,
      visible: !document.hidden,
    })
    const start = () => {
      cursorReady = true
      sync()
    }
    const timer = window.setTimeout(start, 200)
    window.addEventListener("load", sync, { once: true })
    document.addEventListener("visibilitychange", sync)
    motion.addEventListener("change", sync)
    sync()
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("load", sync)
      document.removeEventListener("visibilitychange", sync)
      motion.removeEventListener("change", sync)
    }
  }, [])

  const isBlog = pathname === "/blog" || pathname?.startsWith("/blog/")
  /** 照片墙是强滚动叙事页，飘落花瓣会和视差/推近抢注意力，本页让位 */
  const isPhotoWall = pathname?.startsWith("/blog/travel")
  /** 后台是长时间盯着看的工具界面，装饰性动效一律关掉 */
  const isAdmin = pathname?.startsWith("/admin")
  return (
    <>
      {gates.falling && !isPhotoWall && !isAdmin && <FallingOverlay running={gates.visible} />}
      {gates.cursor && gates.visible && trackMouse && isBlog && <SplashCursor />}
    </>
  )
}
