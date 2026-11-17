/**
 * WGS-84 ↔ GCJ-02 坐标转换。
 *
 * 为什么需要：
 * - 照片 EXIF / GPS 设备给的是 WGS-84（GPS 原始坐标系）
 * - 高德**境内**底图是 GCJ-02（火星坐标），直接丢 WGS-84 会偏移 50–500 米
 * - 高德**境外**底图是 WGS-84，对境外点做转换反而引入偏移
 *
 * 所以：库里统一存 WGS-84，渲染时按点归属决定是否转换。
 *
 * 判定「境内」不能只看经纬度包围盒——中国的 bbox 覆盖了河内、乌兰巴托、
 * 海参崴等境外城市，会把它们误判为境内并做偏移。本项目 Footprint 里有
 * province adcode，用它判定才可靠。
 */

const PI = Math.PI
/** 克拉索夫斯基椭球长半轴 */
const A = 6378245.0
/** 椭球偏心率平方 */
const EE = 0.00669342162296594323

/**
 * 中国省级 adcode 范围（110000 北京 ~ 820000 澳门）。
 * 这是判断「是否该做 GCJ-02 偏移」的首选信号。
 */
export function isDomesticAdcode(adcode: number | null | undefined): boolean {
    if (typeof adcode !== "number" || !Number.isFinite(adcode)) return false
    return adcode >= 110000 && adcode <= 829999
}

/**
 * 粗粒度地理判定：是否明显在中国境外。
 * 仅作为 adcode 缺失时的兜底——注意中国 bbox 包含部分邻国城市，
 * 单靠它无法区分河内/乌兰巴托，故不能作为唯一依据。
 */
export function isOutOfChina(lng: number, lat: number): boolean {
    return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271
}

function transformLat(x: number, y: number): number {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
    ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
    ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
    ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
    return ret
}

function transformLng(x: number, y: number): number {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
    ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
    ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
    ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
    return ret
}

/** WGS-84 → GCJ-02（数学正变换，无分支） */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
    let dLat = transformLat(lng - 105.0, lat - 35.0)
    let dLng = transformLng(lng - 105.0, lat - 35.0)

    const radLat = (lat / 180.0) * PI
    let magic = Math.sin(radLat)
    magic = 1 - EE * magic * magic
    const sqrtMagic = Math.sqrt(magic)

    dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
    dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)

    return [lng + dLng, lat + dLat]
}

/**
 * GCJ-02 → WGS-84。
 * 反解没有解析式，用不动点迭代逼近；3 轮后误差约 1e-10 度（亚毫米级）。
 */
export function gcj02ToWgs84(lng: number, lat: number): [number, number] {
    let wLng = lng
    let wLat = lat
    for (let i = 0; i < 3; i++) {
        const [gLng, gLat] = wgs84ToGcj02(wLng, wLat)
        wLng += lng - gLng
        wLat += lat - gLat
    }
    return [wLng, wLat]
}

/**
 * 渲染前换算：境内点转 GCJ-02，境外点原样返回。
 *
 * @param adcode 该点的省级 adcode（Footprint.province）；有值时以它为准
 */
export function toDisplayCoord(
    lng: number,
    lat: number,
    adcode?: number | null,
): [number, number] {
    // 有 adcode 时用它判定，这是最可靠的信号
    if (typeof adcode === "number" && Number.isFinite(adcode)) {
        return isDomesticAdcode(adcode) ? wgs84ToGcj02(lng, lat) : [lng, lat]
    }
    // 没有 adcode 时退回地理兜底
    return isOutOfChina(lng, lat) ? [lng, lat] : wgs84ToGcj02(lng, lat)
}
