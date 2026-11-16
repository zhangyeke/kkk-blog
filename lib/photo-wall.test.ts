import {
    collectCities,
    collectProvinces,
    countByRegion,
    countPhotos,
    filterSpots,
    groupSpots,
    normalizePhotos,
    sortSpots,
} from "./photo-wall"
import type { PhotoSpot } from "@/types/photo-wall"

function spot(patch: Partial<PhotoSpot> & { id: number }): PhotoSpot {
    return {
        title: `地点 ${patch.id}`,
        provinceCode: "340000",
        provinceName: "安徽省",
        cityCode: "340100",
        cityName: "合肥市",
        districtName: "蜀山区",
        photos: ["https://img.example/1.jpg"],
        createdAt: "2026-01-01T00:00:00.000Z",
        ...patch,
    }
}

test("normalizePhotos drops blanks, non-strings and duplicates while keeping order", () => {
    expect(
        normalizePhotos(["  https://a/1.jpg ", "", "https://a/1.jpg", "https://a/2.jpg", null, undefined]),
    ).toEqual(["https://a/1.jpg", "https://a/2.jpg"])
})

test("sortSpots orders by province, city, district then title", () => {
    const rows = [
        spot({ id: 1, provinceCode: "340000", cityCode: "341000", title: "黄山" }),
        spot({ id: 2, provinceCode: "330000", cityCode: "330100", title: "西湖" }),
        spot({ id: 3, provinceCode: "340000", cityCode: "340100", title: "包公园" }),
        spot({ id: 4, provinceCode: "340000", cityCode: "340100", title: "大蜀山" }),
    ]
    expect(sortSpots(rows).map((s) => s.id)).toEqual([2, 3, 4, 1])
})

test("filterSpots prefers city over province", () => {
    const rows = [
        spot({ id: 1, cityCode: "340100" }),
        spot({ id: 2, cityCode: "341000", cityName: "黄山市" }),
        spot({ id: 3, provinceCode: "330000", provinceName: "浙江省", cityCode: "330100", cityName: "杭州市" }),
    ]
    expect(filterSpots(rows, { provinceCode: null, cityCode: null }).map((s) => s.id)).toEqual([1, 2, 3])
    expect(filterSpots(rows, { provinceCode: "340000", cityCode: null }).map((s) => s.id)).toEqual([1, 2])
    expect(filterSpots(rows, { provinceCode: "340000", cityCode: "340100" }).map((s) => s.id)).toEqual([1])
})

test("groupSpots builds province → city nesting with counts", () => {
    const rows = sortSpots([
        spot({ id: 1, photos: ["a", "b"] }),
        spot({ id: 2, photos: ["c"] }),
        spot({ id: 3, cityCode: "341000", cityName: "黄山市", photos: ["d", "e", "f"] }),
        spot({ id: 4, provinceCode: "330000", provinceName: "浙江省", cityCode: "330100", cityName: "杭州市" }),
    ])

    const groups = groupSpots(rows)
    expect(groups.map((g) => g.provinceName)).toEqual(["浙江省", "安徽省"])
    const anhui = groups.find((g) => g.provinceCode === "340000")!
    expect(anhui.spotCount).toBe(3)
    expect(anhui.photoCount).toBe(6)
    expect(anhui.cities.map((c) => c.cityName)).toEqual(["合肥市", "黄山市"])
    expect(anhui.cities[0]!.spots.map((s) => s.id)).toEqual([1, 2])
})

test("counts and region collection stay consistent", () => {
    const rows = [
        spot({ id: 1, photos: ["a", "b"] }),
        spot({ id: 2, cityCode: "341000", cityName: "黄山市", photos: ["c"] }),
        spot({ id: 3, provinceCode: "330000", provinceName: "浙江省", cityCode: "330100", cityName: "杭州市", photos: [] }),
    ]

    expect(countPhotos(rows)).toBe(3)
    expect(collectProvinces(rows)).toEqual([
        {code: "330000", name: "浙江省"},
        {code: "340000", name: "安徽省"},
    ])
    expect(collectCities(rows, "340000").map((c) => c.name)).toEqual(["合肥市", "黄山市"])
    expect(collectCities(rows, null)).toHaveLength(3)

    const counts = countByRegion(rows)
    expect(counts.province.get("340000")).toBe(3)
    expect(counts.city.get("330100")).toBe(0)
})
