"use client"

import { useEffect, useRef } from "react"
import { useShallow } from "zustand/react/shallow"
import { useAppStore } from "@/hooks"
import { type FallingDirection, fallingImageUrl, type FallingPattern, fallingSeasons, isFallingSeason } from "@/lib/falling-patterns"
import { createFallingCanvas } from "./falling-canvas"
import { createImageSprite, createPatternSprites } from "./falling-sprite"

type FallingCanvasProps = {
  pattern: Exclude<FallingPattern, "none">
  source: string
  density: number
  min: number
  max: number
  speed: number
  direction: FallingDirection
  running: boolean
}

function FallingCanvas({ pattern, source, density, min, max, speed, direction, running }: FallingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<ReturnType<typeof createFallingCanvas>>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = createFallingCanvas(canvas)
    engineRef.current = engine
    return () => {
      engine?.dispose()
      engineRef.current = undefined
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setOptions(density, min, max, speed)
  }, [density, min, max, speed])

  useEffect(() => {
    engineRef.current?.setDirection(direction)
  }, [direction])

  const url = pattern === "image" ? fallingImageUrl(source) : null
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    const useBuiltIn = () => {
      const patterns = isFallingSeason(pattern)
        ? fallingSeasons[pattern].patterns
        : [pattern === "image" ? "petal" : pattern] as const
      const motion = patterns[0] === "star" ? "meteor" : patterns[0] === "rain" ? "rain"
        : patterns[0] === "fireworks" ? "fireworks" : "float"
      engine.setSprites(motion === "fireworks" ? [] : patterns.flatMap((artwork) => createPatternSprites(artwork)), motion)
    }
    if (!url) {
      useBuiltIn()
      return
    }

    const image = new Image()
    image.referrerPolicy = "no-referrer"
    image.onload = () => {
      const sprite = createImageSprite(image)
      if (sprite) engine.setSprites([sprite])
      else useBuiltIn()
    }
    image.onerror = useBuiltIn
    image.src = url
    return () => {
      image.onload = image.onerror = null
    }
  }, [pattern, url])

  useEffect(() => {
    engineRef.current?.setRunning(running)
  }, [running])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="falling-overlay pointer-events-none fixed inset-0 z-45 block size-full motion-reduce:hidden"
    />
  )
}

export default function FallingOverlay({ running }: { running: boolean }) {
  const {
    fallingEnabled: enabled,
    fallingPattern: pattern,
    fallingImage: source,
    fallingDensity: density,
    fallingSpeed: speed,
    fallingDirection: direction = "down",
    fallingSizes: [min, max],
  } = useAppStore(useShallow((state) => ({
    fallingEnabled: state.fallingEnabled,
    fallingPattern: state.fallingPattern,
    fallingImage: state.fallingImage,
    fallingDensity: state.fallingDensity,
    fallingSpeed: state.fallingSpeed,
    fallingDirection: state.fallingDirection,
    fallingSizes: state.fallingSizes,
  })))

  if (!enabled || pattern === "none" || (pattern === "image" && !source)) return null

  return <FallingCanvas {...{ pattern, source, density, min, max, speed, direction, running }} />
}
