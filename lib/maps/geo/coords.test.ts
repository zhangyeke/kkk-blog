import {
    gcj02ToWgs84,
    isDomesticAdcode,
    isOutOfChina,
    toDisplayCoord,
    wgs84ToGcj02,
} from "./coords"

describe("境内判定", () => {
    test("省级 adcode 判定", () => {
        expect(isDomesticAdcode(110000)).toBe(true) // 北京
        expect(isDomesticAdcode(340000)).toBe(true) // 安徽
        expect(isDomesticAdcode(820000)).toBe(true) // 澳门
        expect(isDomesticAdcode(0)).toBe(false) // 境外占位值
        expect(isDomesticAdcode(900000)).toBe(false)
        expect(isDomesticAdcode(null)).toBe(false)
        expect(isDomesticAdcode(undefined)).toBe(false)
    })

    test("地理兜底只用于明显境外", () => {
        expect(isOutOfChina(2.3522, 48.8566)).toBe(true) // 巴黎
        expect(isOutOfChina(116.4074, 39.9042)).toBe(false) // 北京
    })

    test("包围盒无法区分河内（这正是要用 adcode 的原因）", () => {
        // 河内在中国的经纬度包围盒内，地理兜底会误判为境内
        expect(isOutOfChina(105.8342, 21.0278)).toBe(false)
        // 但 adcode 判定能正确识别为境外
        expect(isDomesticAdcode(0)).toBe(false)
    })
})

describe("WGS-84 → GCJ-02", () => {
    test("北京天安门偏移量与公开数据一致", () => {
        const [lng, lat] = wgs84ToGcj02(116.3912, 39.9073)
        expect(lng).toBeCloseTo(116.3975, 3)
        expect(lat).toBeCloseTo(39.9087, 3)
    })

    test("境内偏移量在 50–1000 米量级", () => {
        const [lng, lat] = wgs84ToGcj02(116.3912, 39.9073)
        const dx = (lng - 116.3912) * 111320 * Math.cos((39.9073 * Math.PI) / 180)
        const dy = (lat - 39.9073) * 110540
        const meters = Math.hypot(dx, dy)
        expect(meters).toBeGreaterThan(50)
        expect(meters).toBeLessThan(1000)
    })
})

describe("GCJ-02 → WGS-84", () => {
    test("与正变换互为逆运算，误差小于 1e-9 度", () => {
        const lng = 121.4737
        const lat = 31.2304
        const [gLng, gLat] = wgs84ToGcj02(lng, lat)
        const [wLng, wLat] = gcj02ToWgs84(gLng, gLat)
        expect(Math.abs(wLng - lng)).toBeLessThan(1e-9)
        expect(Math.abs(wLat - lat)).toBeLessThan(1e-9)
    })
})

describe("toDisplayCoord", () => {
    test("境内点（有 adcode）做偏移", () => {
        const [lng] = toDisplayCoord(116.3912, 39.9073, 110000)
        expect(lng).not.toBeCloseTo(116.3912, 4)
        expect(lng).toBeCloseTo(116.3975, 3)
    })

    test("境外点（adcode 非中国）原样返回", () => {
        expect(toDisplayCoord(2.3522, 48.8566, 0)).toEqual([2.3522, 48.8566])
        // 河内：adcode 缺失时也应按地理兜底……但这里显式给 0，必须原样
        expect(toDisplayCoord(105.8342, 21.0278, 0)).toEqual([105.8342, 21.0278])
    })

    test("缺 adcode 时退回地理兜底", () => {
        // 巴黎明显在境外 → 原样
        expect(toDisplayCoord(2.3522, 48.8566)).toEqual([2.3522, 48.8566])
        // 北京在境内 → 偏移
        const [lng] = toDisplayCoord(116.3912, 39.9073)
        expect(lng).toBeCloseTo(116.3975, 3)
    })
})
