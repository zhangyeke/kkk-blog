import { type BuiltInFallingPattern, fallingShading, getFallingArtwork } from "@/lib/falling-patterns"

const spriteSize = 192
const patternCache = new Map<BuiltInFallingPattern, readonly HTMLCanvasElement[]>()
const maxCachedPatterns = 4

export function createPatternSprites(pattern: BuiltInFallingPattern): readonly HTMLCanvasElement[] {
  const cached = patternCache.get(pattern)
  if (cached) {
    patternCache.delete(pattern)
    patternCache.set(pattern, cached)
    return cached
  }
  const { colors, layers, framePadding = 0, shading = fallingShading, travelRotation = 0 } = getFallingArtwork(pattern)
  if (typeof Path2D === "undefined") return []

  const paths = layers.map((layer) => ({ ...layer, shape: new Path2D(layer.path) }))
  const scale = spriteSize / (24 + framePadding * 2)
  const offset = framePadding * scale
  const sprites = colors.flatMap((color) => {
    const sprite = document.createElement("canvas")
    sprite.width = sprite.height = spriteSize
    const context = sprite.getContext("2d")
    if (!context) return []

    context.setTransform(scale, 0, 0, scale, offset, offset)
    // Align each design's leading edge with the engine's local downward axis.
    if (travelRotation) {
      context.translate(12, 12)
      context.rotate(travelRotation * Math.PI / 180)
      context.translate(-12, -12)
    }
    context.lineCap = context.lineJoin = "round"
    for (const { shape, fill, stroke, strokeWidth, opacity, shade, rotate } of paths) {
      context.save()
      context.globalAlpha = opacity ?? 1
      if (rotate) {
        context.translate(12, 12)
        context.rotate(rotate * Math.PI / 180)
        context.translate(-12, -12)
      }
      if (fill) {
        context.fillStyle = fill === "currentColor" ? color : fill
        context.fill(shape)
      }
      if (shade) {
        const { x1, y1, x2, y2, stops } = shading
        const gradient = context.createLinearGradient(x1, y1, x2, y2)
        for (const { offset, color, opacity } of stops) {
          gradient.addColorStop(offset, color + Math.round(opacity * 255).toString(16).padStart(2, "0"))
        }
        context.fillStyle = gradient
        context.fill(shape)
      }
      if (stroke) {
        context.strokeStyle = stroke === "currentColor" ? color : stroke
        context.lineWidth = strokeWidth ?? 1
        context.stroke(shape)
      }
      context.restore()
    }
    return [sprite]
  })
  if (sprites.length === colors.length) {
    if (patternCache.size >= maxCachedPatterns) {
      const oldest = patternCache.keys().next().value
      if (oldest !== undefined) patternCache.delete(oldest)
    }
    patternCache.set(pattern, sprites)
  }
  return sprites
}

export function createImageSprite(image: HTMLImageElement) {
  const sprite = document.createElement("canvas")
  const context = sprite.getContext("2d")
  const { naturalWidth, naturalHeight } = image
  if (!context || !naturalWidth || !naturalHeight) return undefined

  sprite.width = sprite.height = spriteSize
  const scale = spriteSize / Math.max(naturalWidth, naturalHeight)
  const width = naturalWidth * scale
  const height = naturalHeight * scale
  context.drawImage(image, (spriteSize - width) / 2, (spriteSize - height) / 2, width, height)
  return sprite
}
