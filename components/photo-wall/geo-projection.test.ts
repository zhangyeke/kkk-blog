import { applyCamera, CAMERA_COUNTRY, cameraFor, lerpCamera, projectRegions } from "./geo-projection"
import type { ChinaGeoJSON } from "@/types/china-map"

const geo = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: {adcode: 340000, name: "安徽省", centroid: [117.2, 31.8]},
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [115, 30],
                        [119, 30],
                        [119, 34],
                        [115, 34],
                        [115, 30],
                    ],
                ],
            },
        },
        {
            type: "Feature",
            properties: {adcode: 330000, name: "浙江省", center: [120, 29]},
            geometry: {
                type: "MultiPolygon",
                coordinates: [
                    [
                        [
                            [119, 28],
                            [121, 28],
                            [121, 30],
                            [119, 30],
                            [119, 28],
                        ],
                    ],
                    [
                        [
                            [122, 29],
                            [122.4, 29],
                            [122.4, 29.4],
                            [122, 29.4],
                            [122, 29],
                        ],
                    ],
                ],
            },
        },
    ],
} as unknown as ChinaGeoJSON

test("projects every feature into the viewBox and keeps identity", () => {
    const regions = projectRegions(geo, 1000, 720, 18)
    expect(regions).toHaveLength(2)
    expect(regions.map((r) => r.adcode)).toEqual(["340000", "330000"])
    expect(regions.map((r) => r.name)).toEqual(["安徽省", "浙江省"])
})

test("paths are closed and stay inside the padded viewBox", () => {
    const regions = projectRegions(geo, 1000, 720, 18)
    for (const region of regions) {
        expect(region.d.startsWith("M")).toBe(true)
        expect(region.d.endsWith("Z")).toBe(true)
        expect(region.d).not.toContain("NaN")

        const {x, y, w, h} = region.bounds
        expect(x).toBeGreaterThanOrEqual(17)
        expect(y).toBeGreaterThanOrEqual(17)
        expect(x + w).toBeLessThanOrEqual(983)
        expect(y + h).toBeLessThanOrEqual(703)
    }
})

test("uses centroid first, then center, for label anchors", () => {
    const [anhui, zhejiang] = projectRegions(geo, 1000, 720, 18)
    expect(anhui!.label).not.toBeNull()
    expect(zhejiang!.label).not.toBeNull()
    // 两个锚点都应落在各自包围盒内
    for (const region of [anhui!, zhejiang!]) {
        const {x, y, w, h} = region.bounds
        expect(region.label!.x).toBeGreaterThanOrEqual(x - 1)
        expect(region.label!.x).toBeLessThanOrEqual(x + w + 1)
        expect(region.label!.y).toBeGreaterThanOrEqual(y - 1)
        expect(region.label!.y).toBeLessThanOrEqual(y + h + 1)
    }
})

test("returns an empty list for unusable input", () => {
    expect(projectRegions({type: "FeatureCollection", features: []}, 1000, 720)).toEqual([])
})

test("draws the south china sea feature as a separate inset in the corner", () => {
    const withInset = {
        type: "FeatureCollection",
        features: [
            ...(geo.features as ChinaGeoJSON["features"]),
            {
                type: "Feature",
                properties: {adcode: "100000_JD", name: ""},
                geometry: {
                    type: "MultiPolygon",
                    coordinates: [
                        [
                            [
                                [108, 3.4],
                                [122, 3.4],
                                [122, 24.6],
                                [108, 24.6],
                                [108, 3.4],
                            ],
                        ],
                    ],
                },
            },
        ],
    } as unknown as ChinaGeoJSON

    const regions = projectRegions(withInset, 1000, 720, 18)
    const mainland = regions.filter((r) => !r.inset)
    const insets = regions.filter((r) => r.inset)

    expect(mainland).toHaveLength(2)
    expect(insets).toHaveLength(1)

    // 插图落在右下角框内，且不参与主图包围盒计算（主图范围不变）
    const {x, y, w, h} = insets[0]!.bounds
    expect(x).toBeGreaterThan(800)
    expect(y).toBeGreaterThan(480)
    expect(x + w).toBeLessThanOrEqual(1000)
    expect(y + h).toBeLessThanOrEqual(720)

    const anhui = mainland.find((r) => r.adcode === "340000")!
    expect(anhui.bounds.w).toBeGreaterThan(200)
})

describe("相机模型", () => {
    const anhui = {x: 400, y: 300, w: 100, h: 120}

    test("cameraFor 把目标区域放大并居中", () => {
        const cam = cameraFor(anhui, {pad: 0.78})
        expect(cam.scale).toBeGreaterThan(1)

        // 目标中心经相机变换后应落在画布中心 (500, 360)
        const center = applyCamera({x: anhui.x + anhui.w / 2, y: anhui.y + anhui.h / 2}, cam)
        expect(center.x).toBeCloseTo(500, 5)
        expect(center.y).toBeCloseTo(360, 5)
    })

    test("cameraFor 的 scale 被夹在 [1, max]", () => {
        expect(cameraFor({x: 0, y: 0, w: 2000, h: 2000}).scale).toBe(1)
        expect(cameraFor({x: 0, y: 0, w: 1, h: 1}).scale).toBe(7)
        expect(cameraFor({x: 0, y: 0, w: 1, h: 1}, {max: 12}).scale).toBe(12)
    })

    test("全国相机是恒等变换", () => {
        expect(CAMERA_COUNTRY).toEqual({scale: 1, x: 0, y: 0})
        expect(applyCamera({x: 12, y: 34}, CAMERA_COUNTRY)).toEqual({x: 12, y: 34})
    })

    test("lerpCamera 的 scale 走对数插值", () => {
        const a = {scale: 1, x: 0, y: 0}
        const b = {scale: 16, x: -100, y: 50}
        const mid = lerpCamera(a, b, 0.5)
        // 对数中点 = sqrt(1*16) = 4，而不是算术中点 8.5
        expect(mid.scale).toBeCloseTo(4, 5)
        expect(mid.x).toBeCloseTo(-50, 5)
        expect(mid.y).toBeCloseTo(25, 5)

        expect(lerpCamera(a, b, 0)).toEqual(a)
        expect(lerpCamera(a, b, 1).scale).toBeCloseTo(16, 5)
    })
})
