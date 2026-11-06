"use client"

import { useEffect, useState } from "react"
import { Icon } from "@/components/k-view/Icon/Icon"

export const BackTop = () => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!visible) return null
  return (
    <button
      type="button"
      aria-label="返回顶部"
      className="fixed right-5 bottom-1/8 z-50 cursor-pointer text-[2rem] motion-safe:hover:animate-bounce"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        })
      }
    >
      <Icon name="back-top" />
    </button>
  )
}
