/** 与 DataV / ECharts 常用 GeoJSON 结构兼容 */
export type ChinaGeoJSON = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties?: {name?: string; adcode?: number; [key: string]: unknown} | null;
        geometry: object;
    }>;
};

const DATAV_BASE = "https://geo.datav.aliyun.com/areas_v3/bound";

export type ChinaMapScope = "country" | "province";

const cache: {
    country: ChinaGeoJSON | null;
    province: Map<string, ChinaGeoJSON>;
} = {
    country: null,
    province: new Map()
};

async function fetchGeo(adcode: string): Promise<ChinaGeoJSON> {
    const url = `${DATAV_BASE}/${adcode}_full.json`;
    const res = await fetch(url, {next: {revalidate: 86400}});
    if (!res.ok) {
        throw new Error(`无法拉取地图数据: ${adcode} (${res.status})`);
    }
    return (await res.json()) as ChinaGeoJSON;
}

function provinceNameByAdcode(featureCollection: ChinaGeoJSON, adcode: number) {
    const f = featureCollection.features.find(
        (x) => (x.properties as {adcode?: number} | null)?.adcode === adcode
    );
    return (f?.properties as {name?: string} | undefined)?.name;
}

/**
 * 全国省级：adcode=100000；下钻到省/直辖市内区划：{省 adcode}_full（与阿里云 DataV 区划数据一致）
 */
export async function getChinaMapPayload(scope: ChinaMapScope, code?: string) {
    if (scope === "country") {
        if (!cache.country) {
            cache.country = await fetchGeo("100000");
        }
        return {
            scope,
            adcode: null as number | null,
            parentAdcode: null as number | null,
            name: "中国" as const,
            geo: cache.country
        };
    }

    if (scope === "province") {
        const c = (code ?? "").replace(/\D/g, "");
        if (c.length !== 6) {
            throw new Error("请提供 6 位省级 adcode");
        }
        if (!cache.province.has(c)) {
            cache.province.set(c, await fetchGeo(c));
        }
        const geo = cache.province.get(c)!;
        if (!cache.country) {
            cache.country = await fetchGeo("100000");
        }
        const adcode = Number(c);
        const name =
            provinceNameByAdcode(cache.country, adcode) ??
            provinceNameByAdcode(geo, adcode) ??
            `区划 ${c}`;

        return {
            scope,
            adcode,
            parentAdcode: 100_000,
            name,
            geo
        };
    }

    throw new Error("不支持的 scope");
}
