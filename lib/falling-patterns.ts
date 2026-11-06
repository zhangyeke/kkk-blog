type ArtworkLayer = {
  path: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  shade?: boolean
  rotate?: number
}

type FallingArtwork = {
  label: string
  colors: readonly [string, ...string[]]
  layers: readonly ArtworkLayer[]
  framePadding?: number
  travelRotation?: number
  shading?: ArtworkShading
}

type ArtworkShading = {
  x1: number
  y1: number
  x2: number
  y2: number
  stops: readonly { offset: number; color: string; opacity: number }[]
}

const roundedPetal = "M12 13.3C9.6 12.7 7.1 9.8 7.1 6.6C7.1 3.7 9.2 1.9 12 1.9C14.8 1.9 16.9 3.7 16.9 6.6C16.9 9.8 14.4 12.7 12 13.3Z"

const sakuraPetal = `
  M7.6 22.6
  C7.12 22.38 7.53 21.02 7.26 19.55
  C7.06 18.07 6.38 17.37 5.58 16.16
  C4.39 14.34 3.71 12.54 3.85 10.6
  C3.81 8.98 4.23 7.63 5.09 6.45
  C6.14 4.83 7.57 3.41 9.3 2.45
  C10.46 1.78 11.74 1.18 12.54 1.28
  C13.06 1.33 12.91 2.53 13.56 2.85
  C14.32 3.1 14.28 1.69 15.09 1.57
  C15.52 1.48 16.32 1.8 16.99 2.09
  C18.24 2.65 19.22 3.87 19.71 5.17
  C20.18 6.31 20.25 7.4 20.09 8.67
  C20.06 10.47 19.46 12.44 18.6 13.96
  C17.51 15.93 16.05 17.58 14.08 18.58
  C12.79 19.26 11.56 19.37 10.46 19.96
  C9.4 20.54 8.53 21.55 8.13 22.36
  Q7.94 22.82 7.6 22.6Z
`

export const fallingPatterns = {
  petal: {
    label: "花瓣",
    colors: ["#ec91a9", "#ee9eb4"],
    layers: [
      ...[144, 216, 288, 72, 0].map((rotate) => ({
        path: roundedPetal, fill: "currentColor", stroke: "#b85876", strokeWidth: 0.21, shade: true, rotate,
      })),
      { path: "M12 10.55a1.45 1.45 0 1 1 0 2.9a1.45 1.45 0 1 1 0-2.9Z", fill: "#bb565d" },
      { path: "M11.6 11.25h.01m.9.13h.01m.25.9h.01m-1 .48h.01m-.45-.75h.01", stroke: "#ffdb83", strokeWidth: 0.51 },
    ],
  },
  leaf: {
    label: "枫叶",
    travelRotation: 180,
    colors: ["#d45a36", "#e68b39", "#b94742", "#f4ac4b"],
    layers: [
      { path: "M12 1l2 5 3-2-1 6 5-2-1 4 3 1-6 5 1 2-5-1v4h-2v-4l-5 1 1-2-6-5 3-1-1-4 5 2-1-6 3 2Z", fill: "currentColor", shade: true },
      { path: "M12 18V7m0 8 5-3m-5 3-5-3", stroke: "#fff2c6", strokeWidth: 0.62, opacity: 0.64 },
    ],
  },
  treeLeaf: {
    label: "树叶",
    travelRotation: 180,
    colors: ["#61935a", "#82ab54", "#bb9c42", "#cc8d47"],
    layers: [
      { path: "M20.8 2.4C15 3.8 10 2.7 6 6.2C2.3 9.5 2.6 15.7 6.3 18.4C9.7 20.9 15 19.3 17.8 15.4C20.4 11.7 19.3 6.8 20.8 2.4Z", fill: "currentColor", shade: true },
      { path: "M3.5 21.2C7.3 16.8 12.5 11.2 17.7 6.8M8 16.2c.4-2.3.2-3.9-.4-5.1m3.2 2.3c2.1.1 3.9-.4 5.4-1.3", stroke: "#eaf0bf", strokeWidth: 0.77, opacity: 0.84 },
    ],
  },
  snow: {
    label: "雪花",
    colors: ["#a4cde7", "#b6dbe9", "#8eafd7"],
    layers: [
      { path: "M12 1v22M2.5 6.5l19 11m0-11-19 11M9 3l3 3 3-3m-6 18 3-3 3 3M2.5 10l4-1-.9-4m12.8 14-.9-4 4-1M2.5 14l4 1-.9 4M18.4 5l-.9 4 4 1", stroke: "currentColor", strokeWidth: 1.45 },
    ],
  },
  star: {
    label: "流星",
    colors: ["#ffd781", "#fff1b3"],
    layers: [
      { path: "M12 1C12.2 8 14 16 14 21a2 2 0 0 1-4 0C10 16 11.8 8 12 1Z", shade: true },
      { path: "M12 18.8a1.6 1.6 0 1 1 0 3.2a1.6 1.6 0 1 1 0-3.2Z", fill: "currentColor" },
    ],
    shading: { x1: 12, y1: 1, x2: 12, y2: 22, stops: [
      { offset: 0, color: "#e9a854", opacity: 0 },
      { offset: 0.58, color: "#efad54", opacity: 0.42 },
      { offset: 1, color: "#ffce75", opacity: 1 },
    ] },
  },
  fireworks: {
    label: "烟花",
    colors: ["#ed769a", "#f0a749", "#aa8deb", "#5ebfba"],
    layers: [
      { path: "M12 8V3m0 13v5M8 12H3m13 0h5M9.2 9.2 5.6 5.6m9.2 9.2 3.6 3.6m-9.2-3.6-3.6 3.6m9.2-9.2 3.6-3.6", stroke: "currentColor", strokeWidth: 1.5 },
    ],
  },
  balloon: {
    label: "气球",
    travelRotation: 180,
    colors: ["#ef7991", "#e6ab56", "#7abbb4", "#9c8ed1", "#6f9bd8"],
    layers: [
      { path: "M12 1C7.3 1 4.8 4.1 5 8.1C5.2 12 8.7 15.6 11.1 16.3L10.1 18H13.9L12.9 16.3C15.3 15.6 18.8 12 19 8.1C19.2 4.1 16.7 1 12 1Z", fill: "currentColor", shade: true },
      { path: "M8.1 8.1C8 6.5 8.8 5 10.1 4.3", stroke: "#fff", strokeWidth: 1.05, opacity: 0.7 },
      { path: "M12 17.8C9.8 19.2 14.7 20.8 12.3 23", stroke: "currentColor", strokeWidth: 0.75 },
    ],
  },
  heart: {
    label: "爱心",
    colors: ["#e67187", "#d85b70", "#f49fa6"],
    layers: [
      { path: "M12 21.5C10.6 20.5 2 14.6 2 8.6C2 5.4 4.2 3.2 7 3.2C9.2 3.2 10.9 4.5 12 6.4C13.1 4.5 14.8 3.2 17 3.2C19.8 3.2 22 5.4 22 8.6C22 14.6 13.4 20.5 12 21.5Z", fill: "currentColor", shade: true },
      { path: "M5.5 8.9C5.5 7.6 6.1 6.6 7 6.2", stroke: "#fff", strokeWidth: 0.85, opacity: 0.6 },
    ],
  },
  sakura: {
    label: "樱花瓣",
    colors: ["#e8a2a6", "#edabad", "#e49ba3"],
    framePadding: 2.5,
    layers: [
      { path: sakuraPetal, fill: "currentColor", shade: true },
      {
        path: "M7.89 21.52C8.69 17.12 6.84 14.47 6.4 11.46C5.77 7.82 7.75 5.35 9.79 4.53C8.65 7.27 8.83 9.28 9.05 11.61C9.41 14.88 8.89 18.87 7.89 21.52Z",
        fill: "#fff0e5", opacity: 0.25,
      },
      {
        path: "M8.08 21.76C10.43 17.25 12.59 12.03 16.87 8.74C18.01 7.86 19.05 7.36 19.8 7.18C19.69 8.38 19.49 9.7 18.98 10.66C14.43 12.63 10.23 18.67 8.08 21.76Z",
        fill: "#cb6077", opacity: 0.13,
      },
      {
        path: "M7.86 22.14C9.26 17.92 10.52 13.29 11.12 8.15M7.95 22.02C10.24 18.48 12.83 14.94 15.56 12.23M7.77 21.82C7.81 17.94 6.94 14.85 5.99 12.53",
        stroke: "#bf5e71", strokeWidth: 0.12, opacity: 0.3,
      },
      { path: sakuraPetal, stroke: "#bd6872", strokeWidth: 0.1, opacity: 0.28 },
      {
        path: "M7.49 21.99Q7.82 22.11 8.23 21.93Q8.06 22.62 7.79 22.65Q7.53 22.66 7.49 21.99Z",
        fill: "#d4a477", opacity: 0.79,
      },
    ],
    shading: {
      x1: 15.3, y1: 2, x2: 8, y2: 22.5,
      stops: [
        { offset: 0, color: "#c85b71", opacity: 0.25 },
        { offset: 0.28, color: "#e68a97", opacity: 0.19 },
        { offset: 0.6, color: "#fff1e5", opacity: 0.53 },
        { offset: 0.8, color: "#ffdcd2", opacity: 0.24 },
        { offset: 1, color: "#bf5668", opacity: 0.54 },
      ],
    },
  },
  rain: {
    label: "下雨",
    colors: ["#77a6d5", "#83bbdb", "#9cc8e6"],
    layers: [
      { path: "M12 1C12 6.7 13 13.8 13.05 20.8C13.1 22.2 12.65 23 12 23C11.35 23 10.9 22.2 10.95 20.8C11 13.8 12 6.7 12 1Z", fill: "currentColor" },
      { path: "M12 14.5v6.3", stroke: "#e5f7ff", strokeWidth: 0.47, opacity: 0.72 },
    ],
  },
} satisfies Record<string, FallingArtwork>

export type BuiltInFallingPattern = keyof typeof fallingPatterns

export const fallingSeasons = {
  spring: { label: "春 · 花瓣与樱花瓣", patterns: ["sakura", "petal"] },
  summer: { label: "夏 · 阵雨", patterns: ["rain"] },
  autumn: { label: "秋 · 枫叶与树叶", patterns: ["leaf", "treeLeaf"] },
  winter: { label: "冬 · 雪花", patterns: ["snow"] },
} as const satisfies Record<string, { label: string; patterns: readonly BuiltInFallingPattern[] }>

export type FallingSeason = keyof typeof fallingSeasons
export type FallingPattern = BuiltInFallingPattern | FallingSeason | "none" | "image"

export function isFallingSeason(pattern: FallingPattern): pattern is FallingSeason {
  return Object.hasOwn(fallingSeasons, pattern)
}

export const getFallingArtwork = (pattern: BuiltInFallingPattern): FallingArtwork => fallingPatterns[pattern]
export const fallingShading: ArtworkShading = {
  x1: 5, y1: 2, x2: 16, y2: 19,
  stops: [
    { offset: 0, color: "#ffffff", opacity: 0.72 },
    { offset: 0.46, color: "#ffffff", opacity: 0.06 },
    { offset: 1, color: "#502337", opacity: 0.44 },
  ],
}

export const fallingSizeLimits = { min: 1, max: 100 }
export const fallingDirections = { up: "上", down: "下", left: "左", right: "右" } as const
export type FallingDirection = keyof typeof fallingDirections
export const fallingSpeed = { min: 0.5, max: 3, step: 0.1, default: 1 }

export function clampFallingDensity(value: number) {
  return Number.isFinite(value) ? Math.min(10, Math.max(1, Math.round(value))) : 4
}

export function clampFallingSpeed(value: number) {
  if (!Number.isFinite(value)) return fallingSpeed.default
  return Math.min(fallingSpeed.max, Math.max(fallingSpeed.min, Math.round(value * 10) / 10))
}

export function fallingImageUrl(value: string) {
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}
