"use client"

import React from "react"
import dynamic from "next/dynamic"
import { Images, PanelRightOpen } from "lucide-react"
import { useTheme } from "next-themes"
import { Empty } from "@/components/k-view/Empty"
import { Spinner } from "@/components/k-view/Loader/Spinner"
import { Drawer } from "@/components/k-view/Popup/Drawer"
import { cn } from "@/lib/utils"
import { countPhotos } from "@/lib/photo-wall"
import { clusterByGrid, type ClusterPoint, clusterPolicy } from "@/lib/geo/cluster"
import type { PhotoMapPoint } from "@/types/photo-map"
import type { PhotoSpot } from "@/types/photo-wall"
import styles from "./PhotoMap.module.css"
import { type AMapMapInstance, type AMapMarkerInstance, type AMapNamespace, loadAMap } from "./amap-loader"

const PLACEHOLDER = "/images/placeholder/image_placeholder.png"
const GalleryModal = dynamic(
  () => import("@/components/GalleryModal").then((module) => module.GalleryModal),
  { ssr: false },
)
const PhotoWallSidebar = dynamic(
  () => import("@/components/photo-wall/PhotoWallDesktop").then((module) => module.PhotoWallDesktop),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-0 flex-1 items-center justify-center" role="status">
        <Spinner text="照片和地点加载中…" />
      </div>
    ),
  },
)

/**
 * 高德官方内置底图样式（不需要在控制台额外开通）。
 * normal 是默认底图；dark 用于站点暗色模式。
 * 配了 GAODI_MAP_STYLE 时会被自定义样式覆盖。
 */
const MAP_STYLE_LIGHT = "amap://styles/normal"
const MAP_STYLE_DARK = "amap://styles/dark"
function currentMapStyle(): string {
  if (typeof document === "undefined") return MAP_STYLE_LIGHT
  return document.documentElement.classList.contains("dark") ? MAP_STYLE_DARK : MAP_STYLE_LIGHT
}
const INITIAL_CENTER: [number, number] = [105, 35]
const INITIAL_ZOOM = 4

export type PhotoMapSkin = "terrain" | "vector"

interface PhotoMapProps {
  /** 由 Server Component 传入（服务端变量） */
  apiKey: string
  /** 高德安全密钥（可选，2.0 需要时配置） */
  securityCode?: string
  points: PhotoMapPoint[]
  spots: PhotoSpot[]
  /** terrain：卫星影像（蓝海 + 绿植被 + 棕裸地）；vector：向量样式底图 */
  skin?: PhotoMapSkin
  /** 自定义底图样式（如 `amap://styles/xxxx`），给了就优先于内置样式 */
  mapStyle?: string
  className?: string
}

type GalleryState = {
  urls: string[]
  imageAddresses: string[]
  index: number
  uniqueId: string
  meta: PhotoMapPoint["location"]
}

export function PhotoMap({
  apiKey,
  securityCode,
  points,
  spots,
  skin = "vector",
  mapStyle,
  className,
}: PhotoMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<AMapMapInstance | null>(null)
  const amapRef = React.useRef<AMapNamespace | null>(null)
  const markersRef = React.useRef<AMapMarkerInstance[]>([])
  const pointsRef = React.useRef<PhotoMapPoint[]>(points)

  const { resolvedTheme } = useTheme()
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle")
  const [errorMsg, setErrorMsg] = React.useState("")
  const [zoom, setZoom] = React.useState(INITIAL_ZOOM)
  const [clusterTotal, setClusterTotal] = React.useState(0)
  const [gallery, setGallery] = React.useState<GalleryState | null>(null)
  const [isSpotDrawerOpen, setIsSpotDrawerOpen] = React.useState(false)
  const [hasOpenedSpotDrawer, setHasOpenedSpotDrawer] = React.useState(false)

  pointsRef.current = points

  const pointsById = React.useMemo(() => new Map(points.map((point) => [point.id, point])), [points])
  const photoCount = React.useMemo(() => countPhotos(spots), [spots])

  function handleSpotDrawerOpenChange(open: boolean) {
    setIsSpotDrawerOpen(open)
    if (open) setHasOpenedSpotDrawer(true)
  }

  const handleLocateSpot = React.useCallback((spot: PhotoSpot) => {
    const point = pointsById.get(spot.id)
    const map = mapRef.current
    if (!point || !map) return
    map.setZoomAndCenter(Math.max(map.getZoom(), 13), [point.displayLng, point.displayLat])
  }, [pointsById])

  const openPoint = React.useCallback((point: PhotoMapPoint) => {
    if (point.photos.length === 0) return
    setGallery({
      urls: point.photos,
      imageAddresses: point.photos.map(() => point.title),
      index: 0,
      uniqueId: `photo-map-${point.id}`,
      meta: point.location,
    })
  }, [])

  const closeGallery = React.useCallback(() => setGallery(null), [])

  /** 重建全部 marker：投影 → 聚合 → 生成 DOM */
  const renderMarkers = React.useCallback(() => {
    const map = mapRef.current
    const AMap = amapRef.current
    if (!map || !AMap) return

    for (const marker of markersRef.current) marker.setMap(null)
    markersRef.current = []

    const currentZoom = map.getZoom()
    const policy = clusterPolicy(currentZoom)
    const currentPoints = pointsRef.current

    const screenPoints: ClusterPoint<PhotoMapPoint>[] = currentPoints.map((point) => {
      const pos = map.lngLatToContainer([point.displayLng, point.displayLat])
      return { id: String(point.id), x: pos.x, y: pos.y, data: point }
    })

    const clusters = policy.enabled
      ? clusterByGrid(screenPoints, policy.cellSize)
      : screenPoints.map((item) => ({ key: item.id, x: item.x, y: item.y, items: [item] }))

    let clustered = 0

    for (const cluster of clusters) {
      if (cluster.items.length > 1) {
        clustered += 1
        const sumLng = cluster.items.reduce((s, i) => s + i.data.displayLng, 0)
        const sumLat = cluster.items.reduce((s, i) => s + i.data.displayLat, 0)
        const center: [number, number] = [sumLng / cluster.items.length, sumLat / cluster.items.length]

        const element = document.createElement("button")
        element.type = "button"
        element.setAttribute("aria-label", `展开 ${cluster.items.length} 个地点`)
        element.className =
          "flex size-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900/85 text-xs font-medium text-white shadow-lg transition-transform hover:scale-110 active:scale-95 dark:bg-white/90 dark:text-neutral-900"
        element.textContent = String(cluster.items.length)
        element.addEventListener("click", (event) => {
          event.stopPropagation()
          map.setZoomAndCenter(Math.min(currentZoom + 2, 17), center)
        })

        const marker = new AMap.Marker({
          position: center,
          content: element,
          anchor: "center",
          zIndex: 120,
        })
        marker.setMap(map)
        markersRef.current.push(marker)
        continue
      }

      const point = cluster.items[0]!.data
      const element = document.createElement("button")
      element.type = "button"
      element.setAttribute("aria-label", `查看 ${point.title}`)
      element.className = "block cursor-zoom-in"

      const frame = document.createElement("span")
      frame.className =
        "block h-12 w-12 overflow-hidden rounded-[4px] border-2 border-white bg-[#ebe7df] shadow-md shadow-black/25 transition-transform hover:scale-105 active:scale-95 dark:border-white/85 dark:bg-neutral-800 dark:shadow-black/50"

      const img = document.createElement("img")
      img.src = point.cover ?? PLACEHOLDER
      img.alt = point.title
      img.loading = "lazy"
      img.decoding = "async"
      img.className = "h-full w-full object-cover"
      frame.appendChild(img)
      element.appendChild(frame)

      element.addEventListener("click", (event) => {
        event.stopPropagation()
        openPoint(point)
      })

      const marker = new AMap.Marker({
        position: [point.displayLng, point.displayLat],
        content: element,
        anchor: "bottom-center",
        zIndex: 100,
      })
      marker.setMap(map)
      markersRef.current.push(marker)
    }

    setZoom(currentZoom)
    setClusterTotal(clustered)
  }, [openPoint])

  // 初始化地图
  React.useEffect(() => {
    let disposed = false

    if (!apiKey) {
      setStatus("error")
      setErrorMsg("未配置 GAODI_MAP_KEY，请在 .env 中填入高德 key 后重启服务")
      return
    }

    setStatus("loading")

    loadAMap(apiKey, securityCode)
      .then((AMap) => {
        if (disposed || !containerRef.current) return
        amapRef.current = AMap

        const terrain = skin === "terrain"
        const map = new AMap.Map(containerRef.current, {
          zoom: INITIAL_ZOOM,
          center: INITIAL_CENTER,
          viewMode: "2D",
          resizeEnable: true,
          // 地形模式用普通底图打底再叠卫星影像；向量模式直接走样式表
          mapStyle: terrain ? "amap://styles/normal" : mapStyle ?? currentMapStyle(),
        })
        mapRef.current = map

        if (terrain) {
          // 卫星影像 + 路网标注：真实地貌配色（海蓝 / 植被绿 / 裸地棕）
          map.add([new AMap.TileLayer.Satellite({ zIndex: 10 }), new AMap.TileLayer.RoadNet({ zIndex: 11 })])
        }

        const sync = () => renderMarkers()
        map.on("zoomend", sync)
        map.on("moveend", sync)

        setStatus("ready")
        // 首帧渲染（等容器尺寸稳定）
        window.setTimeout(() => renderMarkers(), 60)
      })
      .catch((error: unknown) => {
        if (disposed) return
        setStatus("error")
        setErrorMsg(error instanceof Error ? error.message : "地图初始化失败")
      })

    return () => {
      disposed = true
      for (const marker of markersRef.current) marker.setMap(null)
      markersRef.current = []
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [apiKey, securityCode, skin, renderMarkers])

  // 主题切换时同步底图样式
  React.useEffect(() => {
    const map = mapRef.current
    // 地形模式没有暗色变体，靠 mapDark 类做整体压暗
    if (!map || skin === "terrain" || mapStyle) return
    map.setMapStyle(resolvedTheme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT)
  }, [resolvedTheme, skin, mapStyle])

  // 数据变化时重绘，并自动框选全部点
  React.useEffect(() => {
    if (status !== "ready") return
    renderMarkers()

    // 只在数据变化时 fitView，不放进 renderMarkers，否则会和用户平移/缩放打架
    const markers = markersRef.current
    if (markers.length > 0) {
      mapRef.current?.setFitView(markers, false, [72, 72, 72, 72])
    }
  }, [points, status, renderMarkers])

  return (
    <div className={cn(styles.map, "bg-muted relative overflow-hidden", className)}>
      <div ref={containerRef} className="size-full" aria-label="照片地图" />

      {/* 极淡暗角：只在四角压暗，让地图边缘沉下去，主体更聚焦 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_105%_at_50%_45%,transparent_62%,rgba(0,0,0,0.05))] dark:bg-[radial-gradient(125%_105%_at_50%_45%,transparent_52%,rgba(0,0,0,0.28))]"
      />

      {/* 状态覆盖层 */}
      {status !== "ready" && (
        <div className="bg-muted/90 absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          {status === "error" ? <Empty type="address" text={errorMsg} /> : <Spinner  text="地图加载中…"/>}
        </div>
      )}

      {/* HUD：显示地图状态，同时作为照片与地点侧栏的入口 */}
      {status === "ready" && (
        <Drawer
          direction="right"
          open={isSpotDrawerOpen}
          onOpenChange={handleSpotDrawerOpenChange}
          title="照片与地点"
          description={`${spots.length} 个地点 · ${photoCount} 张照片`}
          footer={null}
          contentClassName="h-dvh max-h-dvh overflow-hidden data-[vaul-drawer-direction=right]:w-[min(92vw,560px)] data-[vaul-drawer-direction=right]:max-w-none data-[vaul-drawer-direction=right]:sm:max-w-none"
          trigger={
            <button
              type="button"
              aria-label="打开照片与地点侧栏"
              aria-haspopup="dialog"
              aria-expanded={isSpotDrawerOpen}
              title="打开照片与地点侧栏"
              className="bg-background/90 text-muted-foreground absolute top-3 right-3 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-[11px] tabular-nums shadow-sm backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
            >
              <span className="font-h1 tracking-[0.1em]">z{zoom.toFixed(1)}</span>
              <span className="text-border">·</span>
              <span>{points.length} 个地点</span>
              {clusterTotal > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span>{clusterTotal} 个聚合</span>
                </>
              )}
              <span aria-hidden className="ml-0.5 inline-flex items-center gap-1 border-l pl-2 text-foreground/80">
                <Images className="size-3.5" />
                <PanelRightOpen className="size-3.5" />
              </span>
            </button>
          }
        >
          {hasOpenedSpotDrawer && (
            <div className="min-h-0 flex-1 overflow-hidden">
              <PhotoWallSidebar
                spots={spots}
                layout="sidebar"
                onLocateSpot={handleLocateSpot}
                galleryZIndex={1102}
              />
            </div>
          )}
        </Drawer>
      )}

      <GalleryModal
        isOpen={gallery !== null}
        urls={gallery?.urls ?? []}
        imageAddresses={gallery?.imageAddresses}
        defaultIndex={gallery?.index}
        locationMeta={gallery?.meta}
        uniqueId={gallery?.uniqueId ?? "photo-map"}
        onBackdropClick={closeGallery}
        onCloseButtonClick={closeGallery}
      />
    </div>
  )
}
