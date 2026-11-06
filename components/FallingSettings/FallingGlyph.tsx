import { memo, useId } from "react"
import { type BuiltInFallingPattern, fallingShading, getFallingArtwork } from "@/lib/falling-patterns"

export const FallingGlyph = memo(function FallingGlyph({ pattern, className }: {
  pattern: BuiltInFallingPattern
  className?: string
}) {
  const gradientId = useId()
  const { colors, layers, framePadding = 0, shading = fallingShading } = getFallingArtwork(pattern)
  const { stops, ...bounds } = shading
  const frameSize = 24 + framePadding * 2

  return (
    <svg
      aria-hidden="true"
      className={className}
      style={{ color: colors[0] }}
      width="100%"
      height="100%"
      viewBox={`${-framePadding} ${-framePadding} ${frameSize} ${frameSize}`}
    >
      {layers.some((layer) => layer.shade) && <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" {...bounds}>
          {stops.map(({ offset, color, opacity }) => (
            <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </linearGradient>
      </defs>}
      {layers.map(({ path, fill, stroke, strokeWidth, opacity, shade, rotate }, index) => (
        <g key={index} opacity={opacity} transform={rotate ? `rotate(${rotate} 12 12)` : undefined}>
          {fill && <path d={path} fill={fill} />}
          {shade && <path d={path} fill={`url(#${gradientId})`} />}
          {stroke && (
            <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      ))}
    </svg>
  )
})
