import type { ChinaGeoJSON } from "@/types/china-map"

/**
 * 轻量地图投影：等经纬 + 中纬度余弦校正。
 *
 * 只用「面 + 命中 + 填色 + 文字」，不需要墨卡托的形变精度；
 * 中国范围（73–135E / 18–54N）用 cos(35°) 校正后视觉比例足够自然，
 * 且没有墨卡托把高纬拉长、把海南压扁的问题。
 *
 * 注意：DataV 的 `100000_full.json` 里除 34 个省级面，还有一个 `100000_JD`
 * （南海诸岛/九段线，纬度低到 3.4°N）。它会把整体包围盒拉大、把大陆压扁，
 * 所以主图只用 6 位 adcode 计算包围盒，`100000_JD` 单独按插图框投影到右下角。
 * 这是国标中国地图的常规画法，也满足「台湾、南海诸岛必须呈现」的要求。
 */

const LAT0 = 35
const LON0 = 105
const K = Math.cos((LAT0 * Math.PI) / 180)

/** 右下角南海诸岛插图框（viewBox 坐标系） */
const INSET_BOX = {x: 846, y: 516, w: 138, h: 186, padding: 6}

/**
 * 取景用的纬度下限。
 * 海南省的要素里含三沙/南沙群岛（低到 3.8°N），直接参与包围盒会把大陆压扁；
 * 国标画法是主图只画到大陆+海南岛，南海诸岛用右下角插图单独呈现。
 */
const FIT_LAT_MIN = 15

type Point = [number, number]

export type ProjectedRegion = {
    adcode: string
    name: string
    /** SVG path data */
    d: string
    /** 标签锚点（已投影并 fit），无坐标时为 null */
    label: { x: number; y: number } | null
    /** 该区域在 viewBox 中的包围盒，用于判断标签是否放得下 */
    bounds: { x: number; y: number; w: number; h: number }
    /** 是否为南海诸岛插图（不可交互） */
    inset: boolean
}

function projectRaw([lon, lat]: Point): Point {
    return [(lon - LON0) * K, -(lat - LAT0)]
}

/** 把 Polygon / MultiPolygon 统一成「多边形数组 → 环数组 → 点数组」 */
function toPolygons(geometry: unknown): Point[][][] {
    if (!geometry || typeof geometry !== "object") return []
    const {type, coordinates} = geometry as { type?: string; coordinates?: unknown }
    if (type === "Polygon") return [coordinates as Point[][]]
    if (type === "MultiPolygon") return coordinates as Point[][][]
    return []
}

function ringToPath(ring: Point[], fit: (p: Point) => Point): string {
    if (ring.length < 3) return ""
    let out = ""
    for (let i = 0; i < ring.length; i++) {
        const [x, y] = fit(ring[i]!)
        out += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return `${out}Z`
}

function isProvinceFeature(feature: ChinaGeoJSON["features"][number]): boolean {
    const adcode = (feature.properties as { adcode?: number | string } | null)?.adcode
    return /^\d{6}$/.test(String(adcode ?? ""))
}

type Fit = {
    project: (p: Point) => Point
    bounds: { minX: number; minY: number; maxX: number; maxY: number } | null
}

function collectPoints(features: ChinaGeoJSON["features"]): Point[] {
    const points: Point[] = []
    for (const feature of features) {
        for (const polygon of toPolygons(feature.geometry)) {
            for (const ring of polygon) {
                for (const point of ring) points.push(point)
            }
        }
    }
    return points
}

function makeFit(
    features: ChinaGeoJSON["features"],
    box: { x: number; y: number; w: number; h: number; padding: number },
    minLat = -90,
): Fit {
    const points = collectPoints(features)
        .filter((point) => point[1] >= minLat)
        .map(projectRaw)
    if (points.length === 0) return {project: (p) => p, bounds: null}

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const [x, y] of points) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
    }

    const spanX = Math.max(maxX - minX, 1e-6)
    const spanY = Math.max(maxY - minY, 1e-6)
    const scale = Math.min(
        (box.w - box.padding * 2) / spanX,
        (box.h - box.padding * 2) / spanY,
    )
    const offsetX = box.x + (box.w - spanX * scale) / 2 - minX * scale
    const offsetY = box.y + (box.h - spanY * scale) / 2 - minY * scale

    return {
        project: ([x, y]) => [x * scale + offsetX, y * scale + offsetY],
        bounds: {minX, minY, maxX, maxY},
    }
}

function buildRegion(
    feature: ChinaGeoJSON["features"][number],
    fit: (p: Point) => Point,
    inset: boolean,
): ProjectedRegion {
    const props = (feature.properties ?? {}) as {
        adcode?: number | string
        name?: string
        center?: Point
        centroid?: Point
    }

    let bx = Infinity
    let by = Infinity
    let bx2 = -Infinity
    let by2 = -Infinity
    let d = ""

    // fit 接收的是「已投影」坐标，这里把 projectRaw 组合进去
    const project = (point: Point) => fit(projectRaw(point))

    for (const polygon of toPolygons(feature.geometry)) {
        for (const ring of polygon) {
            d += ringToPath(ring, project)
            for (const point of ring) {
                const [x, y] = project(point)
                if (x < bx) bx = x
                if (y < by) by = y
                if (x > bx2) bx2 = x
                if (y > by2) by2 = y
            }
        }
    }

    const anchor = props.centroid ?? props.center
    let label: { x: number; y: number } | null = null
    if (anchor) {
        const [x, y] = project(anchor)
        label = {x, y}
    }

    return {
        adcode: props.adcode != null ? String(props.adcode) : "",
        name: props.name ?? "",
        d,
        label,
        bounds: {
            x: Number.isFinite(bx) ? bx : 0,
            y: Number.isFinite(by) ? by : 0,
            w: Number.isFinite(bx2) ? bx2 - bx : 0,
            h: Number.isFinite(by2) ? by2 - by : 0,
        },
        inset,
    }
}

/**
 * 生成可直接渲染的区域路径。
 * 主图与插图各用一套缩放，互不影响。
 */
export function projectRegions(
    geo: ChinaGeoJSON,
    width = 1000,
    height = 720,
    padding = 18,
): ProjectedRegion[] {
    const features = geo.features ?? []
    const provinceFeatures = features.filter(isProvinceFeature)
    const insetFeatures = features.filter((feature) => !isProvinceFeature(feature))

    const mainFit = makeFit(provinceFeatures, {x: 0, y: 0, w: width, h: height, padding}, FIT_LAT_MIN)
    const insetFit = makeFit(insetFeatures, INSET_BOX)

    const regions = provinceFeatures.map((feature) => buildRegion(feature, mainFit.project, false))

    // 省内视图（如 340000_full.json）没有插图要素，insetFeatures 为空，这里自然跳过
    const insets = insetFeatures.map((feature) => buildRegion(feature, insetFit.project, true))

    return [...regions, ...insets]
}

/** 南海诸岛插图框，供组件画边框 */
export const MAP_INSET_BOX = INSET_BOX

/** 地图画布尺寸：所有图层共用这个坐标系，推近只是 transform */
export const MAP_VIEW = {w: 1000, h: 720} as const

export type Bounds = ProjectedRegion["bounds"]

/** 相机：把 viewBox 空间映射到视口的 scale + 平移 */
export type Camera = {scale: number; x: number; y: number}

export const CAMERA_COUNTRY: Camera = {scale: 1, x: 0, y: 0}

/**
 * 全国投影函数。省/市层必须复用它，才能和全国层严丝合缝地叠在一起。
 * 一旦各层各算各的 fit，推近时就会错位。
 */
export function createMainFit(geo: ChinaGeoJSON, padding = 18): (point: Point) => Point {
    const features = (geo.features ?? []).filter(isProvinceFeature)
    return makeFit(features, {x: 0, y: 0, w: MAP_VIEW.w, h: MAP_VIEW.h, padding}, FIT_LAT_MIN).project
}

/** 用给定的投影函数渲染 geo（省市层用它复用全国 fit） */
export function projectRegionsInFit(
    geo: ChinaGeoJSON,
    project: (point: Point) => Point,
): ProjectedRegion[] {
    const features = geo.features ?? []
    const insetProject = makeFit(features.filter((f) => !isProvinceFeature(f)), INSET_BOX).project

    return features.map((feature) =>
        buildRegion(feature, isProvinceFeature(feature) ? project : insetProject, !isProvinceFeature(feature)),
    )
}

/**
 * 由包围盒算出相机位。
 * `pad` 是目标区域占画布的比例（0.78 = 四周留 22% 呼吸）；
 * `scale` 夹在 [1, max]：1 表示全国原尺寸，上限防止北京/上海这类小行政区推过头。
 */
export function cameraFor(
    bounds: Bounds,
    {pad = 0.78, zoom = 1, max = 7}: { pad?: number; zoom?: number; max?: number } = {},
): Camera {
    const cx = bounds.x + bounds.w / 2
    const cy = bounds.y + bounds.h / 2
    const raw = Math.min(
        (MAP_VIEW.w * pad) / Math.max(bounds.w, 1),
        (MAP_VIEW.h * pad) / Math.max(bounds.h, 1),
    )
    const scale = Math.min(Math.max(raw * zoom, 1), max)
    return {
        scale,
        x: MAP_VIEW.w / 2 - cx * scale,
        y: MAP_VIEW.h / 2 - cy * scale,
    }
}

/** 相机插值：scale 走对数，1→4 与 4→16 的视觉速度才一致 */
export function lerpCamera(a: Camera, b: Camera, t: number): Camera {
    const s = Math.exp(Math.log(Math.max(a.scale, 0.01)) * (1 - t) + Math.log(Math.max(b.scale, 0.01)) * t)
    return {
        scale: s,
        x: a.x * (1 - t) + b.x * t,
        y: a.y * (1 - t) + b.y * t,
    }
}

/** 把 viewBox 里的点按相机换算到屏幕坐标（标签层不参与 transform，靠这个定位） */
export function applyCamera(point: { x: number; y: number }, camera: Camera) {
    return {
        x: point.x * camera.scale + camera.x,
        y: point.y * camera.scale + camera.y,
    }
}
