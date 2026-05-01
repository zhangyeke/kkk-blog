"use server"

import {env} from "env.mjs"
import type {ChinaGeoJSON, ChinaMapPayload, ChinaMapScope} from "@/types/china-map"
import {
    ActionError,
    backFailMessage,
    backSuccessMessage,
    SUCCESS_CODE
} from "@/lib/actionMessageBack"

const geoByAdcode = new Map<string, ChinaGeoJSON>()

function mapBasePath() {
    return env.MAP_BASE_URL.replace(/\/$/, "")
}

/** 与地图页一致：DataV 风格 `{adcode}_full.json` */
async function fetchFullGeoByAdcode(adcode: string): Promise<BaseResource<ChinaGeoJSON | null>> {
    const key = adcode.replace(/\D/g, "")
    if (key.length !== 6) {
        return backFailMessage("区划 adcode 须为 6 位数字", null)
    }
    const url = `${mapBasePath()}/${key}_full.json`
    const res = await fetch(url, {next: {revalidate: 86_400}})
    if (!res.ok) {
        return backFailMessage(`无法拉取地图数据: ${key}（HTTP ${res.status}）`, null)
    }
    const data = (await res.json()) as ChinaGeoJSON
    return backSuccessMessage("获取地图数据成功", data)
}

function unwrapGeoResource(r: BaseResource<ChinaGeoJSON | null>): ChinaGeoJSON {
    if (r.code === SUCCESS_CODE && r.data != null) {
        return r.data
    }
    throw new ActionError(r.message, r.code)
}

async function getGeoCached(adcode: string): Promise<ChinaGeoJSON> {
    const key = adcode.replace(/\D/g, "")
    if (key.length !== 6) {
        throw new Error("区划 adcode 须为 6 位数字")
    }
    if (!geoByAdcode.has(key)) {
        const r = await fetchFullGeoByAdcode(key)
        geoByAdcode.set(key, unwrapGeoResource(r))
    }
    return geoByAdcode.get(key)!
}

function provinceNameByAdcode(featureCollection: ChinaGeoJSON, adcode: number) {
    const f = featureCollection.features.find(
        (x) => (x.properties as {adcode?: number} | null)?.adcode === adcode
    )
    return (f?.properties as {name?: string} | undefined)?.name
}

/**
 * 全国省级：adcode=100000；子级为任意 6 位 adcode 对应 `_full`（与阿里云 DataV 一致）
 */
export async function getChinaMapPayload(scope: ChinaMapScope, code?: string): Promise<ChinaMapPayload> {
    if (scope === "country") {
        const geo = await getGeoCached("100000")
        return {
            scope,
            adcode: null,
            parentAdcode: null,
            name: "中国",
            geo
        }
    }

    if (scope === "province") {
        const c = (code ?? "").replace(/\D/g, "")
        if (c.length !== 6) {
            throw new Error("请提供 6 位省级 adcode")
        }
        const geo = await getGeoCached(c)
        const country = await getGeoCached("100000")
        const adcode = Number(c)
        const name = provinceNameByAdcode(country, adcode) ?? provinceNameByAdcode(geo, adcode) ?? `区划 ${c}`

        return {
            scope,
            adcode,
            parentAdcode: 100_000,
            name,
            geo
        }
    }

    throw new Error("不支持的 scope")
}

export type RegionCascaderOption = {id: string; name: string}

function chinaGeoToRegionList(geo: ChinaGeoJSON): RegionCascaderOption[] {
    const list = geo.features
        .map((f) => {
            const p = f.properties as {name?: string; adcode?: number} | null
            if (p == null || p.adcode == null || p.name == null || p.name === "") {
                return null
            }
            return {id: String(p.adcode), name: p.name}
        })
        .filter((x): x is RegionCascaderOption => x != null)
    return list.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"))
}

/**
 * 与 AsyncCascader 约定：`pathPrefix` 为空为省级根；非空时末项为要展开子列表的 6 位 adcode
 */
export async function loadRegionCascaderData(pathPrefix: string[]): Promise<RegionCascaderOption[]> {
    const adcode = pathPrefix.length === 0 ? "100000" : pathPrefix[pathPrefix.length - 1]!
    const digits = adcode.replace(/\D/g, "")
    if (digits.length !== 6) {
        return []
    }
    const geo = await getGeoCached(digits)
    return chinaGeoToRegionList(geo)
}
