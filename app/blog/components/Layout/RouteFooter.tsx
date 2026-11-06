"use client"

import { usePathname } from "next/navigation"


const hiddenFooterPaths = new Set([
  "/blog/article/list",
  "/blog/index",
  "/blog/jiangshan-map",
  "/blog/map",
  "/blog/me",
  "/blog/setting"
])

export default function RouteFooter({ children }: ContainerProps) {
  const pathname = usePathname()?.replace(/\/$/, "")
  if (pathname && (hiddenFooterPaths.has(pathname) || pathname.startsWith("/blog/me/"))) return null
  return children
}
