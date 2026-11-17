"use client"

/**
 * 全屏图片画廊：主图预览（支持缩放/旋转/滚轮）、方向键切图、
 * 响应式缩略条（IntersectionObserver 懒加载），可与 Framer Motion layoutId 衔接入场动画。
 */
import React, { memo, useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { Image } from "@/components/k-view/Image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCw, Undo2, X, ZoomIn, ZoomOut } from "lucide-react"
import type { PhotoLocationMeta } from "@/types/photo-wall"

/** 主图 transform: scale 下限 / 上限 / 按钮与滚轮的单次步进 */
const PREVIEW_SCALE_MIN = 0.5
const PREVIEW_SCALE_MAX = 3
const PREVIEW_SCALE_STEP = 0.25
const WHEEL_ZOOM_SENSITIVITY = 0.0015

type ImageTransform = {
  x: number
  y: number
  scale: number
  rotation: number
}

type PointerPosition = { x: number; y: number }

const INITIAL_IMAGE_TRANSFORM: ImageTransform = { x: 0, y: 0, scale: 1, rotation: 0 }

function clampScale(scale: number) {
  return Math.min(PREVIEW_SCALE_MAX, Math.max(PREVIEW_SCALE_MIN, scale))
}

function getPointerDistance(a: PointerPosition, b: PointerPosition) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function getPointerCenter(a: PointerPosition, b: PointerPosition): PointerPosition {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export type GalleryModalProps = {
  /** 是否展示画廊层 */
  isOpen: boolean
  /** 点击半透明遮罩时回调（通常等同关闭） */
  onBackdropClick: () => void
  /** 显式关闭：关闭按钮、Esc 等 */
  onCloseButtonClick: () => void
  /** 与入口元素共用的 Framer Motion layoutId；须在页面内唯一，避免动画串台 */
  uniqueId?: string
  /** 单图预览可传标题和可访问名称。 */
  title?: string
  dialogLabel?: string
  /** 单图场景可隐藏没有意义的缩略栏。 */
  showThumbnails?: boolean
  /** 覆盖全屏画廊层级，供嵌在抽屉中的画廊显示在抽屉上方。 */
  zIndex?: number
  /** Portal 出去后的主题作用域。 */
  themePreset?: string
  /** 图片地址列表 */
  urls: Array<string>
  /** 打开时默认选中的下标（会夹紧到 [0, urls.length-1]） */
  defaultIndex?: number
  /** 地图或照片墙场景：省/市/区（不含拼接的多条 address） */
  locationMeta?: PhotoLocationMeta | null
  /** 与 urls 等长时每张图对应足迹的唯一 address */
  imageAddresses?: string[]
}

type GalleryThumbProps = {
  url: string
  index: number
  isSelected: boolean
  scrollRoot: HTMLElement | null
  onPick: (index: number) => void
}

/** 缩略图：在侧边滚动容器内用 IO 再挂 src，避免原生 lazy 以视口为根导致条内图片被一次性拉取 */
const GalleryThumb = memo(function GalleryThumb({
  url,
  index,
  isSelected,
  scrollRoot,
  onPick,
}: GalleryThumbProps) {
  const btnRef = useRef<HTMLButtonElement | null>(null)
  /** 当前项选中则立刻加载；未选中则等 IO 认为进入缩略可视区再挂 src */
  const [shouldLoad, setShouldLoad] = useState(isSelected)

  useEffect(() => {
    // 被选中的缩略图始终加载，避免换页后当前项仍是占位灰块
    if (isSelected) {
      setShouldLoad(true)
    }
  }, [isSelected])

  useEffect(() => {
    if (shouldLoad || !scrollRoot) {
      return
    }
    const el = btnRef.current
    if (!el) {
      return
    }
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true)
        }
      },
      { root: scrollRoot, rootMargin: "80px 0px", threshold: 0.01 }
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [shouldLoad, scrollRoot, url, index])

  return (
    <button
      ref={btnRef}
      type="button"
      role="listitem"
      className={`relative block h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 text-left transition md:w-full ${
        isSelected ? "border-primary opacity-100" : "border-transparent opacity-80 hover:opacity-100"
      }`}
      onClick={() => onPick(index)}
    >
      {shouldLoad ? (
        <Image src={url} alt={`thumb_${index}`} className="pointer-events-none h-full w-full rounded-sm" loading="lazy" />
      ) : (
        <div className="bg-muted h-full w-full rounded-sm" aria-hidden />
      )}
    </button>
  )
})

/** 全屏画廊：桌面端右侧缩略列表，移动端底部横向缩略列表。 */
export function GalleryModal({
  isOpen,
  onBackdropClick,
  onCloseButtonClick,
  uniqueId,
  title,
  dialogLabel = "图片画廊",
  showThumbnails = true,
  zIndex = 50,
  themePreset,
  urls,
  defaultIndex = 0,
  locationMeta = null,
  imageAddresses,
}: GalleryModalProps) {
  /** 当前主图在 urls 中的下标 */
  const [selectedIndex, setSelectedIndex] = useState(0)
  /** 手势过程中的 scale 放在 state 里只用于同步工具栏状态；高频位移只写入 DOM。 */
  const [previewScale, setPreviewScale] = useState(1)
  const [previewHasOffset, setPreviewHasOffset] = useState(false)
  /** 缩略条根据屏幕方向沿对应轴拖动。 */
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [thumbDragConstraints, setThumbDragConstraints] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  })
  const thumbViewportRef = useRef<HTMLDivElement | null>(null)
  /** 图片 viewport 接收鼠标滚轮、鼠标拖拽和移动端双指手势。 */
  const previewWheelRef = useRef<HTMLDivElement | null>(null)
  const previewTransformRef = useRef<ImageTransform>({ ...INITIAL_IMAGE_TRANSFORM })
  const previewTransformElementRef = useRef<HTMLDivElement | null>(null)
  const previewPaintFrameRef = useRef<number | null>(null)
  /** 传给 GalleryThumb 的 IO root，lazy 以侧栏滚动容器为根而非窗口 */
  const [thumbScrollRoot, setThumbScrollRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches)
    syncViewport()
    mediaQuery.addEventListener("change", syncViewport)
    return () => mediaQuery.removeEventListener("change", syncViewport)
  }, [])

  const applyPreviewTransform = useCallback((transform: ImageTransform) => {
    previewTransformRef.current = transform
    if (previewPaintFrameRef.current != null) {
      return
    }

    previewPaintFrameRef.current = window.requestAnimationFrame(() => {
      previewPaintFrameRef.current = null
      const element = previewTransformElementRef.current
      if (!element) {
        return
      }
      const current = previewTransformRef.current
      element.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) scale(${current.scale}) rotate(${current.rotation}deg)`
    })
  }, [])

  useEffect(
    () => () => {
      if (previewPaintFrameRef.current != null) {
        window.cancelAnimationFrame(previewPaintFrameRef.current)
      }
    },
    [],
  )

  const zoomPreviewAt = useCallback(
    (scale: number, clientX: number, clientY: number) => {
      const viewport = previewWheelRef.current
      const current = previewTransformRef.current
      const nextScale = clampScale(scale)
      if (!viewport || nextScale === current.scale) {
        return nextScale
      }

      const bounds = viewport.getBoundingClientRect()
      const pointerX = clientX - bounds.left
      const pointerY = clientY - bounds.top
      const centerX = bounds.width / 2
      const centerY = bounds.height / 2
      const ratio = nextScale / current.scale

      applyPreviewTransform({
        ...current,
        scale: nextScale,
        x: pointerX - centerX - ratio * (pointerX - centerX - current.x),
        y: pointerY - centerY - ratio * (pointerY - centerY - current.y),
      })
      return nextScale
    },
    [applyPreviewTransform],
  )

  const setThumbViewport = useCallback((el: HTMLDivElement | null) => {
    thumbViewportRef.current = el
    setThumbScrollRoot(el)
  }, [])

  const selectImage = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  // 每次打开或 urls / defaultIndex 变化时，将选中下标夹紧到合法区间
  useEffect(() => {
    if (!isOpen || urls.length === 0) {
      return
    }
    const i = Math.max(0, Math.min(defaultIndex, urls.length - 1))
    setSelectedIndex(i)
  }, [isOpen, defaultIndex, urls])

  // 每张图片独立从默认位置、缩放和旋转开始。
  useEffect(() => {
    if (!isOpen) {
      return
    }
    applyPreviewTransform({ ...INITIAL_IMAGE_TRANSFORM })
    setPreviewScale(1)
    setPreviewHasOffset(false)
  }, [applyPreviewTransform, isOpen, selectedIndex])

  // 打开时锁定 body 滚动；监听 Esc / 方向键（仅 isOpen 时生效）
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        return
      }
      if (event.key === "Escape") {
        onCloseButtonClick()
        return
      }
      // 左/上 → 上一张；右/下 → 下一张（与常见相册习惯一致）
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedIndex((i) => (i > 0 ? i - 1 : i))
        return
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault()
        const last = urls.length - 1
        setSelectedIndex((i) => (i < last ? i + 1 : i))
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("overflow-hidden")
    }
  }, [isOpen, onCloseButtonClick, urls.length])

  // 缩略区域尺寸或图片数量变化时，按当前方向重算拖动范围。
  useEffect(() => {
    const el = thumbViewportRef.current
    if (!el || !isOpen) {
      return
    }
    const measure = () => {
      const horizontalOverflow = Math.max(0, el.scrollWidth - el.clientWidth)
      const verticalOverflow = Math.max(0, el.scrollHeight - el.clientHeight)
      setThumbDragConstraints((previous) => {
        if (
          previous.left === -horizontalOverflow &&
          previous.top === -verticalOverflow &&
          previous.right === 0 &&
          previous.bottom === 0
        ) {
          return previous
        }
        return {
          left: -horizontalOverflow,
          right: 0,
          top: -verticalOverflow,
          bottom: 0,
        }
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMobileViewport, isOpen, urls.length])

  const currentImageAddress =
    imageAddresses?.length === urls.length ? (imageAddresses[selectedIndex] ?? "").trim() : ""
  const currentUrl = urls.length > 0 ? (urls[selectedIndex] ?? null) : null

  // 图片 viewport 的指针手势：单指/鼠标平移、双指缩放并跟随双指中心点。
  useEffect(() => {
    if (!isOpen || currentUrl == null) {
      return
    }
    const viewport = previewWheelRef.current
    if (!viewport) {
      return
    }

    type Gesture =
      | { kind: "pan"; pointerId: number; start: PointerPosition; x: number; y: number }
      | {
          kind: "pinch"
          distance: number
          scale: number
          center: PointerPosition
          x: number
          y: number
        }
      | null

    const activePointers = new Map<number, PointerPosition>()
    let gesture: Gesture = null
    let scaleCommitTimer: number | null = null

    const getLocalPosition = (event: PointerEvent): PointerPosition => {
      const bounds = viewport.getBoundingClientRect()
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }

    const startPan = (pointerId: number, point: PointerPosition) => {
      const current = previewTransformRef.current
      gesture = { kind: "pan", pointerId, start: point, x: current.x, y: current.y }
    }

    const startPinch = () => {
      const points = [...activePointers.values()]
      const first = points[0]
      const second = points[1]
      if (!first || !second) {
        return
      }
      const current = previewTransformRef.current
      gesture = {
        kind: "pinch",
        distance: Math.max(1, getPointerDistance(first, second)),
        scale: current.scale,
        center: getPointerCenter(first, second),
        x: current.x,
        y: current.y,
      }
    }

    const scheduleScaleCommit = () => {
      if (scaleCommitTimer != null) {
        window.clearTimeout(scaleCommitTimer)
      }
      scaleCommitTimer = window.setTimeout(() => {
        const current = previewTransformRef.current
        setPreviewScale(current.scale)
        setPreviewHasOffset(current.x !== 0 || current.y !== 0)
        scaleCommitTimer = null
      }, 100)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return
      }
      event.preventDefault()
      viewport.setPointerCapture(event.pointerId)
      const point = getLocalPosition(event)
      activePointers.set(event.pointerId, point)
      if (activePointers.size > 1) {
        startPinch()
      } else {
        startPan(event.pointerId, point)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!activePointers.has(event.pointerId)) {
        return
      }
      event.preventDefault()
      activePointers.set(event.pointerId, getLocalPosition(event))

      if (activePointers.size > 1) {
        if (gesture?.kind !== "pinch") {
          startPinch()
        }
        if (gesture?.kind !== "pinch") {
          return
        }
        const points = [...activePointers.values()]
        const first = points[0]
        const second = points[1]
        if (!first || !second) {
          return
        }
        const center = getPointerCenter(first, second)
        const scale = clampScale(gesture.scale * (getPointerDistance(first, second) / gesture.distance))
        const ratio = scale / gesture.scale
        const bounds = viewport.getBoundingClientRect()
        const centerX = bounds.width / 2
        const centerY = bounds.height / 2

        applyPreviewTransform({
          ...previewTransformRef.current,
          scale,
          x: center.x - centerX - ratio * (gesture.center.x - centerX - gesture.x),
          y: center.y - centerY - ratio * (gesture.center.y - centerY - gesture.y),
        })
        return
      }

      if (gesture?.kind === "pan" && gesture.pointerId === event.pointerId) {
        const point = activePointers.get(event.pointerId)!
        applyPreviewTransform({
          ...previewTransformRef.current,
          x: gesture.x + point.x - gesture.start.x,
          y: gesture.y + point.y - gesture.start.y,
        })
      }
    }

    const finishPointer = (event: PointerEvent) => {
      if (!activePointers.delete(event.pointerId)) {
        return
      }
      if (activePointers.size > 1) {
        startPinch()
      } else if (activePointers.size === 1) {
        const [pointerId, point] = [...activePointers.entries()][0]!
        startPan(pointerId, point)
      } else {
        gesture = null
        const current = previewTransformRef.current
        setPreviewScale(current.scale)
        setPreviewHasOffset(current.x !== 0 || current.y !== 0)
      }
    }

    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      // 支持普通滚轮与触控板 ctrl+wheel 手势，缩放锚点跟随光标。
      const sensitivity = event.ctrlKey ? 0.01 : WHEEL_ZOOM_SENSITIVITY
      const scale = previewTransformRef.current.scale * Math.exp(-event.deltaY * sensitivity)
      zoomPreviewAt(scale, event.clientX, event.clientY)
      scheduleScaleCommit()
    }

    viewport.addEventListener("pointerdown", onPointerDown)
    viewport.addEventListener("pointermove", onPointerMove)
    viewport.addEventListener("pointerup", finishPointer)
    viewport.addEventListener("pointercancel", finishPointer)
    viewport.addEventListener("lostpointercapture", finishPointer)
    viewport.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      viewport.removeEventListener("pointerdown", onPointerDown)
      viewport.removeEventListener("pointermove", onPointerMove)
      viewport.removeEventListener("pointerup", finishPointer)
      viewport.removeEventListener("pointercancel", finishPointer)
      viewport.removeEventListener("lostpointercapture", finishPointer)
      viewport.removeEventListener("wheel", onWheel)
      if (scaleCommitTimer != null) {
        window.clearTimeout(scaleCommitTimer)
      }
    }
  }, [applyPreviewTransform, currentUrl, isOpen, zoomPreviewAt])

  const canPrev = selectedIndex > 0

  const canNext = urls.length > 0 && selectedIndex < urls.length - 1

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setSelectedIndex((i) => {
      const last = urls.length - 1
      return i < last ? i + 1 : i
    })
  }, [urls.length])

  const rotatePreview = useCallback(() => {
    const current = previewTransformRef.current
    applyPreviewTransform({ ...current, rotation: (current.rotation + 90) % 360 })
  }, [applyPreviewTransform])

  const zoomPreviewByButton = useCallback(
    (direction: -1 | 1) => {
      const viewport = previewWheelRef.current
      if (!viewport) {
        return
      }
      const bounds = viewport.getBoundingClientRect()
      const scale = zoomPreviewAt(
        previewTransformRef.current.scale + direction * PREVIEW_SCALE_STEP,
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2,
      )
      setPreviewScale(scale)
      const current = previewTransformRef.current
      setPreviewHasOffset(current.x !== 0 || current.y !== 0)
    },
    [zoomPreviewAt],
  )

  const zoomPreviewIn = useCallback(() => zoomPreviewByButton(1), [zoomPreviewByButton])
  const zoomPreviewOut = useCallback(() => zoomPreviewByButton(-1), [zoomPreviewByButton])

  const resetPreviewZoom = useCallback(() => {
    const current = previewTransformRef.current
    applyPreviewTransform({ ...current, x: 0, y: 0, scale: 1 })
    setPreviewScale(1)
    setPreviewHasOffset(false)
  }, [applyPreviewTransform])

  const canZoomIn = previewScale < PREVIEW_SCALE_MAX
  const canZoomOut = previewScale > PREVIEW_SCALE_MIN

  const handleCloseButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onCloseButtonClick()
  }, [onCloseButtonClick])

  // 标题行：行政区 + 单条 address，用于地图下钻等场景
  const locationTitleLine = (() => {
    const parts: string[] = []
    if (locationMeta) {
      for (const key of ["provinceName", "cityName", "districtName"] as const) {
        const s = (locationMeta[key] ?? "").trim()
        if (s) {
          parts.push(s)
        }
      }
    }
    if (currentImageAddress) {
      parts.push(currentImageAddress)
    }
    return parts.join(" · ")
  })()

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && urls.length > 0 && currentUrl != null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={dialogLabel}
          aria-description={title || locationTitleLine || undefined}
          data-preset={themePreset}
          className={`pointer-events-auto fixed inset-0 z-50 flex h-dvh w-full cursor-zoom-out flex-col items-center justify-center backdrop-blur-lg ${
            themePreset ? "admin-shell" : "bg-neutral-300/80 dark:bg-black/80"
          }`}
          style={{
            zIndex,
            ...(themePreset ? { background: "color-mix(in oklab, var(--adm-paper) 90%, transparent)" } : {}),
          }}
          onClick={onBackdropClick}
        >
          {/* 主卡片：阻止冒泡，避免误触遮罩关闭 */}
          <motion.div
            layoutId={uniqueId}
            className="mx-auto box-border flex h-[calc(100dvh-1.5rem)] max-h-[95dvh] w-[calc(100vw-1.5rem)] min-w-0 cursor-auto flex-col items-stretch gap-2 rounded-md md:h-[80%] md:max-h-[90vh] md:w-[95%] md:flex-row md:gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* key=selectedIndex：换图时整段重挂载，配合 AnimatePresence 做淡入 */}
            <motion.figure
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { ease: "easeInOut", duration: 0.25 },
              }}
              exit={{ opacity: 0 }}
              className="border-input flex min-h-0 min-w-0 flex-1 flex-col rounded-md border-2 bg-neutral-100/40 p-2 sm:p-3 md:p-4 dark:bg-neutral-900/40"
              style={themePreset ? { background: "var(--adm-paper-2)", borderColor: "var(--adm-line)" } : undefined}
            >
              <div className="border-border mb-2 flex shrink-0 items-start justify-between gap-3 border-b pb-2 text-sm md:mb-3 md:pb-3">
                <p className="text-foreground min-w-0 flex-1 overflow-x-auto font-medium whitespace-nowrap [scrollbar-width:thin]">
                  {title || locationTitleLine || dialogLabel}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`shrink-0 ${showThumbnails ? "md:hidden" : ""}`}
                  onClick={handleCloseButtonClick}
                  aria-label="关闭预览"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                {/* 大图聚焦区：滚轮缩放仅绑此节点 */}
                <div
                  ref={previewWheelRef}
                  className="flex min-h-0 min-w-0 flex-1 touch-none items-center justify-center overflow-hidden cursor-grab select-none active:cursor-grabbing"
                  role="group"
                  aria-label="图片预览，可拖动平移，滚轮或双指缩放"
                  title="拖动平移；滚轮或双指缩放"
                >
                  <div className="relative size-full min-h-[120px] min-w-0 sm:min-h-[180px] md:min-h-[240px]">
                    <div
                      ref={previewTransformElementRef}
                      className="relative size-full origin-center"
                      style={{ transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)" }}
                    >
                      <Image
                        src={currentUrl}
                        alt={title ?? `preview_${selectedIndex}`}
                        className="pointer-events-none size-full min-h-0 min-w-0 select-none"
                        loading="eager"
                        objectFit="contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex shrink-0 flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={goPrev}
                    aria-label="上一张"
                    title="上一张"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canZoomOut}
                    onClick={zoomPreviewOut}
                    aria-label="缩小"
                    title="缩小"
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canZoomIn}
                    onClick={zoomPreviewIn}
                    aria-label="放大"
                    title="放大"
                  >
                    <ZoomIn className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={previewScale === 1 && !previewHasOffset}
                    onClick={resetPreviewZoom}
                    aria-label="重置缩放"
                    title="重置缩放"
                  >
                    <Undo2 className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={rotatePreview}
                    aria-label="顺时针旋转"
                    title="旋转"
                  >
                    <RotateCw className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canNext}
                    onClick={goNext}
                    aria-label="下一张"
                    title="下一张"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.figure>
            {/* 桌面端位于右侧，移动端改为主图下方的横向缩略条。 */}
            {showThumbnails && (
              <div className="flex h-[76px] w-full shrink-0 flex-row gap-2 md:h-full md:w-[132px] md:flex-col">
                <Button type="button" onClick={handleCloseButtonClick} variant="outline" className="hidden md:inline-flex" aria-label="关闭画廊">
                  关闭画廊
                </Button>
                <div
                  ref={setThumbViewport}
                  className="no-scrollbar border-input flex min-h-0 min-w-0 flex-1 shrink-0 cursor-grab flex-row overflow-x-auto overflow-y-hidden rounded-md border border-solid bg-white/40 p-1 md:w-full md:flex-col md:overflow-x-hidden md:overflow-y-auto md:p-2 dark:bg-neutral-900/40"
                  role="list"
                >
                  <motion.div
                    className="flex h-full w-max flex-row gap-2 md:h-fit md:w-full md:flex-col"
                    drag={isMobileViewport ? "x" : "y"}
                    dragConstraints={thumbDragConstraints}
                    dragElastic={0.2}
                    dragTransition={{ bounceDamping: 30 }}
                    whileDrag={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    {urls.map((url, i) => (
                      <GalleryThumb
                        key={`${i}-${String(url)}`}
                        url={url}
                        index={i}
                        isSelected={selectedIndex === i}
                        scrollRoot={thumbScrollRoot}
                        onPick={selectImage}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
