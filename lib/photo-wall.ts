import type { PhotoFilter, PhotoProvinceGroup, PhotoSpot } from "@/types/photo-wall"
import type { FootprintRowForMap } from "@/lib/geo/map-points"

/** 过滤空串 / 非字符串 / 重复项，保持原始顺序 */
export function normalizePhotos(album: readonly (string | null | undefined)[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const item of album) {
        if (typeof item !== "string") continue
        const url = item.trim()
        if (!url || seen.has(url)) continue
        seen.add(url)
        result.push(url)
    }
    return result
}

type PhotoSpotSourceRow = FootprintRowForMap & { createdAt: Date | string }

/** 将真实地图足迹转换为照片墙条目，保持地点列表与地图点位使用同一批数据。 */
export function footprintRowsToPhotoSpots(rows: readonly PhotoSpotSourceRow[]): PhotoSpot[] {
    return rows.map((row) => {
        const names = (row.regionPath ?? "").split(/\s*\/\s*/u).map((name) =>
            /^\d{6}$/u.test(name) ? "" : name,
        )
        const provinceName = names[0] || "未识别地区"
        const cityName = names[1] || provinceName
        const createdAt = row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString()

        return {
            id: row.id,
            title: row.address?.trim() || `${cityName}的足迹`,
            provinceCode: String(row.province).padStart(6, "0"),
            provinceName,
            cityCode: String(row.city).padStart(6, "0"),
            cityName,
            districtCode: row.area == null ? null : String(row.area).padStart(6, "0"),
            districtName: names[2] ?? "",
            photos: normalizePhotos(row.album),
            createdAt,
        }
    })
}

const collator = new Intl.Collator("zh-Hans-CN")

/**
 * 排序：省 → 市 → 区 → 地点名。
 * adcode 是数字字符串，按数值比较才能保证 340000 < 341000；
 * 地点名用中文 collator 拼音序。
 */
export function sortSpots(spots: readonly PhotoSpot[]): PhotoSpot[] {
    return [...spots].sort((a, b) => {
        const byProvince = Number(a.provinceCode) - Number(b.provinceCode)
        if (byProvince !== 0) return byProvince
        const byCity = Number(a.cityCode) - Number(b.cityCode)
        if (byCity !== 0) return byCity
        const byDistrict = (a.districtName || "").localeCompare(b.districtName || "", "zh-Hans-CN")
        if (byDistrict !== 0) return byDistrict
        return collator.compare(a.title, b.title)
    })
}

/** 按省 / 市筛选；城市优先于省，两者都为空表示不筛选 */
export function filterSpots(spots: readonly PhotoSpot[], filter: PhotoFilter): PhotoSpot[] {
    if (filter.districtCode) return spots.filter((spot) => spot.districtCode === filter.districtCode)
    if (filter.cityCode) return spots.filter((spot) => spot.cityCode === filter.cityCode)
    if (filter.provinceCode) return spots.filter((spot) => spot.provinceCode === filter.provinceCode)
    return [...spots]
}

/** 省 → 市 两级分组，入参需已排序 */
export function groupSpots(spots: readonly PhotoSpot[]): PhotoProvinceGroup[] {
    const groups: PhotoProvinceGroup[] = []
    const provinceIndex = new Map<string, PhotoProvinceGroup>()
    const cityIndex = new Map<string, PhotoProvinceGroup["cities"][number]>()

    for (const spot of spots) {
        let province = provinceIndex.get(spot.provinceCode)
        if (!province) {
            province = {
                provinceCode: spot.provinceCode,
                provinceName: spot.provinceName,
                cities: [],
                spotCount: 0,
                photoCount: 0,
            }
            provinceIndex.set(spot.provinceCode, province)
            groups.push(province)
        }

        const cityKey = `${spot.provinceCode}-${spot.cityCode}`
        let city = cityIndex.get(cityKey)
        if (!city) {
            city = {cityCode: spot.cityCode, cityName: spot.cityName, spots: []}
            cityIndex.set(cityKey, city)
            province.cities.push(city)
        }

        city.spots.push(spot)
        province.spotCount += 1
        province.photoCount += spot.photos.length
    }

    return groups
}

/** 总照片数 */
export function countPhotos(spots: readonly PhotoSpot[]): number {
    return spots.reduce((total, spot) => total + spot.photos.length, 0)
}

/** 从数据里抽出出现过的省份（按 adcode 升序），供筛选条与地图着色使用 */
export function collectProvinces(spots: readonly PhotoSpot[]): Array<{ code: string; name: string }> {
    const map = new Map<string, string>()
    for (const spot of spots) map.set(spot.provinceCode, spot.provinceName)
    return [...map.entries()]
        .map(([code, name]) => ({code, name}))
        .sort((a, b) => Number(a.code) - Number(b.code))
}

/** 从数据里抽出某省下出现过的城市（按 adcode 升序） */
export function collectCities(
    spots: readonly PhotoSpot[],
    provinceCode: string | null,
): Array<{ code: string; name: string }> {
    const map = new Map<string, string>()
    for (const spot of spots) {
        if (provinceCode && spot.provinceCode !== provinceCode) continue
        map.set(spot.cityCode, spot.cityName)
    }
    return [...map.entries()]
        .map(([code, name]) => ({code, name}))
        .sort((a, b) => Number(a.code) - Number(b.code))
}

/** 每个省/市各有多少张照片，供地图着色与「有无照片」判断 */
export function countByRegion(spots: readonly PhotoSpot[]) {
    const province = new Map<string, number>()
    const city = new Map<string, number>()
    for (const spot of spots) {
        province.set(spot.provinceCode, (province.get(spot.provinceCode) ?? 0) + spot.photos.length)
        city.set(spot.cityCode, (city.get(spot.cityCode) ?? 0) + spot.photos.length)
    }
    return {province, city}
}
