"use client"

import { usePathname } from "next/navigation"


const hiddenFooterPaths = new Set([
  "/blog/article/list",
  "/blog/index",
  "/blog/jiangshan-map",
  "/blog/map",
  "/blog/me",
  "/blog/setting",
  // 照片地图是全屏地图页，footer 会把地图挤出视口
  "/blog/pictures/map"
])

export default function RouteFooter({ children }: ContainerProps) {
  const pathname = usePathname()?.replace(/\/$/, "")
  if (pathname && (hiddenFooterPaths.has(pathname) || pathname.startsWith("/blog/me/"))) return null
  return children
}
