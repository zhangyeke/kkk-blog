"use client"

import React from "react"
import { motion, useReducedMotion } from "motion/react"

import { Image } from "@/components/k-view/Image"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import type { PhotoSpot } from "@/types/photo-wall"
import { CARD_ENTER, DUR, EASE_OUT_EXPO, FADE_ONLY } from "./motion"

interface SpotCardProps {
  spot: PhotoSpot
  variant?: "desktop" | "mobile"
  index?: number
  onOpen?: (spot: PhotoSpot, photoIndex: number) => void
  onSelectLocation?: (spot: PhotoSpot) => void
  /** 与 GalleryModal 共用的 layoutId；不传则退回纯淡入 */
  layoutId?: string
  className?: string
}

function regionPath(spot: PhotoSpot): string {
  return [...new Set([spot.provinceName, spot.cityName, spot.districtName].filter(Boolean))].join(" · ")
}

/** 照片的印刷处理：内描边与暗角不参与 transform，避免每帧重绘。 */
function PhotoFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{
          background: "radial-gradient(115% 95% at 50% 0%, transparent 55%, oklch(0 0 0 / .16))",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{ boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--foreground) 12%, transparent)" }}
      />
    </>
  )
}

export function SpotCard({
  spot,
  variant = "desktop",
  index = 0,
  onOpen,
  onSelectLocation,
  layoutId,
  className,
}: SpotCardProps) {
  const reduceMotion = useReducedMotion()
  const isMobile = variant === "mobile"

  return (
    <motion.article
      variants={reduceMotion ? FADE_ONLY : CARD_ENTER}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: reduceMotion ? DUR.fast : DUR.slow,
        ease: EASE_OUT_EXPO,
        delay: reduceMotion ? 0 : Math.min(index, 6) * 0.06,
      }}
      className={cn("group/card", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3
          className={cn(
            "truncate text-[var(--pw-ink)]",
            isMobile ? "text-[1.125rem] leading-[1.625rem]" : "text-[1.3125rem] leading-[1.875rem]"
          )}
          style={{ letterSpacing: "0.01em" }}
          title={spot.title}
        >
          {onSelectLocation ? (
            <button
              type="button"
              onClick={() => onSelectLocation(spot)}
              className="focus-visible:outline-primary cursor-pointer text-left hover:text-[var(--pw-ink-2)] focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label={`在地图上定位到${spot.title}`}
            >
              {spot.title}
            </button>
          ) : (
            spot.title
          )}
        </h3>
        <span className="shrink-0 text-[11px] text-[var(--pw-ink-3)] tabular-nums" style={{ letterSpacing: "0.1em" }}>
          {spot.photos.length} 张
        </span>
      </div>

      {onSelectLocation ? (
        <button
          type="button"
          onClick={() => onSelectLocation(spot)}
          className="focus-visible:outline-primary mt-1 block max-w-full cursor-pointer truncate text-left text-[12px] text-[var(--pw-ink-3)] hover:text-[var(--pw-ink-2)] focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ letterSpacing: "0.06em" }}
          aria-label={`在地图上定位到${regionPath(spot)}的${spot.title}`}
        >
          {regionPath(spot)}
        </button>
      ) : (
        <p className="mt-1 truncate text-[12px] text-[var(--pw-ink-3)]" style={{ letterSpacing: "0.06em" }}>
          {regionPath(spot)}
        </p>
      )}

      {spot.photos.length > 0 && (
        <SpotPhotoCarousel spot={spot} variant={variant} cardIndex={index} layoutId={layoutId} onOpen={onOpen} />
      )}
    </motion.article>
  )
}

interface SpotPhotoCarouselProps {
  spot: PhotoSpot
  variant: "desktop" | "mobile"
  cardIndex: number
  layoutId?: string
  onOpen?: (spot: PhotoSpot, photoIndex: number) => void
}

function SpotPhotoCarousel({ spot, variant, cardIndex, layoutId, onOpen }: SpotPhotoCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const thumbnailViewportRef = React.useRef<HTMLDivElement>(null)
  const isMobile = variant === "mobile"

  React.useEffect(() => {
    if (!api) return

    const syncSelectedIndex = () => setSelectedIndex(api.selectedScrollSnap())
    syncSelectedIndex()
    api.on("select", syncSelectedIndex)
    api.on("reInit", syncSelectedIndex)

    return () => {
      api.off("select", syncSelectedIndex)
      api.off("reInit", syncSelectedIndex)
    }
  }, [api])

  const handleSelectThumbnail = React.useCallback(
    (photoIndex: number) => {
      api?.scrollTo(photoIndex)
    },
    [api]
  )

  return (
    <div className="mt-3">
      <Carousel
        aria-label={`${spot.title}照片轮播`}
        className="group/spot-carousel relative overflow-hidden rounded-[6px]"
        opts={{ align: "start", containScroll: "trimSnaps" }}
        setApi={setApi}
      >
        <CarouselContent className="ml-0">
          {spot.photos.map((src, photoIndex) => (
            <CarouselItem key={`${spot.id}-${photoIndex}-${src}`} className="pl-0">
              <motion.button
                type="button"
                onClick={() => onOpen?.(spot, photoIndex)}
                aria-label={`查看 ${spot.title} 第 ${photoIndex + 1} 张照片`}
                layoutId={selectedIndex === photoIndex ? layoutId : undefined}
                transition={{ layout: { duration: 0.42, ease: EASE_OUT_EXPO } }}
                className={cn(
                  "bg-muted relative block w-full overflow-hidden rounded-[6px]",
                  "focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2"
                )}
                style={{ boxShadow: "var(--pw-shadow-2)" }}
              >
                <PhotoFrame>
                  <Image
                    src={src}
                    alt={`${spot.title} 第 ${photoIndex + 1} 张`}
                    loading={cardIndex === 0 && photoIndex === 0 ? "eager" : "lazy"}
                    className={cn(
                      "w-full rounded-[6px] object-cover",
                      isMobile ? "aspect-[4/3] h-auto" : "aspect-[4/3] sm:aspect-auto sm:h-[300px] xl:h-[340px]"
                    )}
                    style={{ filter: "saturate(1.04) contrast(1.02)" }}
                  />
                </PhotoFrame>
              </motion.button>
            </CarouselItem>
          ))}
        </CarouselContent>

        {spot.photos.length > 1 && (
          <>
            <CarouselPrevious
              aria-label="上一张照片"
              title="上一张照片"
              className={cn(
                "bg-background/90 text-foreground left-3 border-white/70 shadow-md backdrop-blur-sm",
                "hover:bg-background opacity-100 transition-[opacity,transform] duration-200 hover:scale-105 active:scale-95",
                "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/spot-carousel:opacity-100",
                "[@media(hover:hover)]:group-focus-within/spot-carousel:opacity-100"
              )}
            />
            <CarouselNext
              aria-label="下一张照片"
              title="下一张照片"
              className={cn(
                "bg-background/90 text-foreground right-3 border-white/70 shadow-md backdrop-blur-sm",
                "hover:bg-background opacity-100 transition-[opacity,transform] duration-200 hover:scale-105 active:scale-95",
                "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/spot-carousel:opacity-100",
                "[@media(hover:hover)]:group-focus-within/spot-carousel:opacity-100"
              )}
            />
          </>
        )}
      </Carousel>

      {spot.photos.length > 1 && (
        <PhotoThumbnailStrip
          spot={spot}
          variant={variant}
          selectedIndex={selectedIndex}
          onSelect={handleSelectThumbnail}
          viewportRef={thumbnailViewportRef}
        />
      )}
    </div>
  )
}

interface PhotoThumbnailStripProps {
  spot: PhotoSpot
  variant: "desktop" | "mobile"
  selectedIndex: number
  onSelect: (index: number) => void
  viewportRef: React.RefObject<HTMLDivElement | null>
}

function PhotoThumbnailStrip({ spot, variant, selectedIndex, onSelect, viewportRef }: PhotoThumbnailStripProps) {
  const isMobile = variant === "mobile"
  const reduceMotion = useReducedMotion()
  const selectedThumbRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const viewport = viewportRef.current
    const thumb = selectedThumbRef.current
    if (!viewport || !thumb) return

    const viewportBounds = viewport.getBoundingClientRect()
    const thumbBounds = thumb.getBoundingClientRect()
    const leftOverflow = thumbBounds.left - viewportBounds.left
    const rightOverflow = thumbBounds.right - viewportBounds.right

    if (leftOverflow < 0) {
      viewport.scrollBy({ left: leftOverflow, behavior: reduceMotion ? "auto" : "smooth" })
    } else if (rightOverflow > 0) {
      viewport.scrollBy({ left: rightOverflow, behavior: reduceMotion ? "auto" : "smooth" })
    }
  }, [reduceMotion, selectedIndex, viewportRef])

  return (
    <div
      ref={viewportRef}
      role="group"
      aria-label={`${spot.title}照片缩略图`}
      className="mt-2 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain py-1"
      style={{ scrollbarColor: "var(--pw-hair) transparent", scrollbarWidth: "thin" }}
    >
      {spot.photos.map((src, photoIndex) => {
        const selected = photoIndex === selectedIndex
        return (
          <button
            ref={selected ? selectedThumbRef : undefined}
            key={`${spot.id}-thumb-${photoIndex}-${src}`}
            type="button"
            aria-label={`显示 ${spot.title} 第 ${photoIndex + 1} 张照片`}
            aria-pressed={selected}
            onClick={() => onSelect(photoIndex)}
            className={cn(
              "bg-muted relative shrink-0 snap-start overflow-hidden rounded-[4px] transition",
              "focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2",
              "active:scale-95",
              isMobile ? "size-16" : "size-16 sm:size-[84px] xl:size-[96px]",
              selected ? "ring-primary ring-offset-background ring-2 ring-offset-2" : "opacity-80 hover:opacity-100"
            )}
            style={{ boxShadow: "var(--pw-shadow-1)" }}
          >
            <LazyThumb src={src} alt={`${spot.title} 第 ${photoIndex + 1} 张缩略图`} containerRef={viewportRef} />
          </button>
        )
      })}
    </div>
  )
}

/** 只加载进入缩略条可视区附近的图片，缩略图较多时减少首屏请求。 */
function LazyThumb({
  src,
  alt,
  containerRef,
}: {
  src: string
  alt: string
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const holderRef = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const element = holderRef.current
    if (!element || visible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { root: containerRef.current, rootMargin: "160px" }
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [containerRef, visible])

  return (
    <div ref={holderRef} className="size-full">
      {visible ? (
        <Image src={src} alt={alt} className="size-full rounded-[4px] object-cover" />
      ) : (
        <div className="bg-muted size-full" aria-hidden />
      )}
    </div>
  )
}
