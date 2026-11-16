import type { PhotoMapPoint } from "@/types/photo-map"
import { toDisplayCoord } from "./coords"

/** 从库里读出来的足迹行（只取地图需要的字段） */
export type FootprintRowForMap = {
    id: number
    province: number
    city: number
    area: number | null
    address: string | null
    regionPath?: string
    album: string[]
    lat: number | null
    lng: number | null
}

function normalizeAlbum(album: readonly string[] | null | undefined): string[] {
    if (!album) return []
    const seen = new Set<string>()
    const out: string[] = []
    for (const item of album) {
        const url = typeof item === "string" ? item.trim() : ""
        if (!url || seen.has(url)) continue
        seen.add(url)
        out.push(url)
    }
    return out
}

function regionMetaFromPath(regionPath?: string): PhotoMapPoint["location"] {
    const names = (regionPath ?? "").split(/\s*\/\s*/u)
    const toLabel = (name?: string) => (name && !/^\d{6}$/u.test(name) ? name : "")
    return {
        provinceName: toLabel(names[0]),
        cityName: toLabel(names[1]),
        districtName: toLabel(names[2]),
    }
}

/**
 * 足迹行 → 地图点。
 * 坐标在这里做一次换算：境内转 GCJ-02，境外保持 WGS-84。
 */
export function toMapPoints(rows: readonly FootprintRowForMap[]): PhotoMapPoint[] {
    const points: PhotoMapPoint[] = []

    for (const row of rows) {
        if (row.lat == null || row.lng == null) continue
        if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) continue
        if (Math.abs(row.lat) > 90 || Math.abs(row.lng) > 180) continue

        const photos = normalizeAlbum(row.album)
        const [displayLng, displayLat] = toDisplayCoord(row.lng, row.lat, row.province)

        points.push({
            id: row.id,
            title: row.address?.trim() || "未命名地点",
            location: regionMetaFromPath(row.regionPath),
            lng: row.lng,
            lat: row.lat,
            displayLng,
            displayLat,
            cover: photos[0] ?? null,
            photoCount: photos.length,
            photos,
        })
    }

    return points
}

