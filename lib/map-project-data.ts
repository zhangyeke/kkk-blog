import type {ChinaGeoJSON} from "@/lib/china-map";

/** 与你在 page 中约定的项目分布结构 */
export type ProjectMapItem = {
    id: number;
    address: string;
    /**
     * 省级 adcode（6 位），与 `https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json`
     * 及各省 `{省adcode}_full.json` 中对应面的 `properties.adcode` 一致。
     */
    provinceAdcode?: string;
    /**
     * 地级或直辖市区县级 adcode，与下钻后该省 GeoJSON 中对应面的 `properties.adcode` 一致。
     */
    cityAdcode?: string;
    /** 全国视图中按「省」整省汇总展示（如广东省一块） */
    totalNums: number;
    /**
     * 下钻到该省后：键为 **6 位 adcode**（与 GeoJSON `properties.adcode` 一致，如 `440100`），值为数量。
     * 也兼容旧数据：键为区划中文名时仍按 `name` 匹配。
     */
    city: Record<string, number>;
};

/**
 * 从「地址」中拆省/市。全国 GeoJSON 为「xx省」；下钻到省为「xx市」等。
 * 例：`广东省广州市` → 省=广东省，市=广州市
 */
const MUNI = [
    {p: "北京市" as const, re: /^北京市/u},
    {p: "上海市" as const, re: /^上海市/u},
    {p: "天津市" as const, re: /^天津市/u},
    {p: "重庆市" as const, re: /^重庆市/u}
];

export function parseAddress(address: string): {province: string; city: string} {
    const t = address.trim();
    for (const {p, re} of MUNI) {
        if (re.test(t)) {
            return {province: p, city: t.length > p.length ? t.slice(p.length) : p};
        }
    }
    const m = t.match(/^(.+?省|.+?自治区)(.+)$/u);
    if (m) {
        return {province: m[1]!, city: m[2]!};
    }
    return {province: "", city: ""};
}

/**
 * 与当前 GeoJSON 中 `feature.properties.name` 对齐（试精确、补「市」「省」后缀）。
 */
export function matchRegionNameInGeo(geo: ChinaGeoJSON, raw: string): string | null {
    const names = new Set(
        geo.features
            .map((f) => f.properties?.name)
            .filter((n): n is string => typeof n === "string" && n.length > 0)
    );
    if (names.has(raw)) {
        return raw;
    }
    if (!raw.endsWith("市")) {
        const w = `${raw}市`;
        if (names.has(w)) {
            return w;
        }
    }
    if (!raw.endsWith("省") && !raw.includes("自治区")) {
        const p = `${raw}省`;
        if (names.has(p)) {
            return p;
        }
    }
    for (const n of names) {
        if (n === raw || n.startsWith(raw) || raw.startsWith(n)) {
            return n;
        }
    }
    return null;
}

/** 用 6 位 adcode（键里可含非数字，会抽取数字）在当前 GeoJSON 中查找 `properties.name`。 */
export function nameFromAdcodeInGeo(geo: ChinaGeoJSON, key: string): string | null {
    const digits = key.replace(/\D/g, "");
    if (digits.length !== 6) {
        return null;
    }
    const code = Number(digits);
    if (!Number.isFinite(code)) {
        return null;
    }
    for (const f of geo.features) {
        const p = f.properties;
        if (p == null) {
            continue;
        }
        const ac = p.adcode;
        const acNum = typeof ac === "number" ? ac : typeof ac === "string" ? Number(ac) : NaN;
        if (acNum === code) {
            const n = p.name;
            if (typeof n === "string" && n.length > 0) {
                return n;
            }
        }
    }
    return null;
}

function mergeByName(items: Array<{name: string; value: number}>): Array<{name: string; value: number}> {
    const m = new Map<string, number>();
    for (const {name, value} of items) {
        m.set(name, (m.get(name) ?? 0) + value);
    }
    return [...m.entries()].map(([name, value]) => ({name, value}));
}

/** 供 ECharts `map3D` 使用；省级下钻时带 `height` 作光柱拉伸 */
export type Map3DProjectDatum = {
    name: string;
    value: number;
    height?: number;
};

/** 与 map3D `regionHeight` 默认 3.2 拉开差距，下钻后形成「光柱」层次（echarts-gl 用 data.height 做拉伸） */
const PROVINCE_BAR_HEIGHT_MIN = 6;
const PROVINCE_BAR_HEIGHT_MAX = 28;

function withProvinceBarHeights(merged: Array<{name: string; value: number}>): Map3DProjectDatum[] {
    if (merged.length === 0) {
        return [];
    }
    const vals = merged.map((d) => d.value);
    const vMin = Math.min(...vals);
    const vMax = Math.max(...vals);
    const hMid = (PROVINCE_BAR_HEIGHT_MIN + PROVINCE_BAR_HEIGHT_MAX) / 2;
    return merged.map(({name, value}) => {
        const height =
            vMin === vMax
                ? hMid
                : PROVINCE_BAR_HEIGHT_MIN +
                  ((value - vMin) / (vMax - vMin)) * (PROVINCE_BAR_HEIGHT_MAX - PROVINCE_BAR_HEIGHT_MIN);
        return {name, value, height};
    });
}

/**
 * 把业务数据变成 ECharts `map3D` 的 `series.data` + visualMap 用的数值表。
 *
 * - **全国** (`scope === "country"`)：按 **省** 汇总，用 `totalNums`；`name` 与省级面名称一致（如 `广东省`）。
 * - **省级** (`scope === "province"`)：只处理 `address` 中省名与 `currentProvinceName` 一致（如 `广东省`）的项目，
 *   用 `city` 中各区划数量；键优先为 **adcode**（如 `440100`），解析为与市级面一致的 `name`（如 `广州市`）。
 *   省级结果带 **`height`**，用于 map3D 光柱；全国仅填色，不设 `height`。
 */
export function buildMap3DDataFromProjects(
    geo: ChinaGeoJSON,
    projects: ProjectMapItem[],
    scope: "country" | "province",
    currentProvinceName: string
): Map3DProjectDatum[] {
    if (projects.length === 0) {
        return [];
    }
    if (scope === "country") {
        const acc = new Map<string, number>();
        for (const p of projects) {
            const {province} = parseAddress(p.address);
            if (!province) {
                continue;
            }
            const n = matchRegionNameInGeo(geo, province);
            if (n == null) {
                continue;
            }
            acc.set(n, (acc.get(n) ?? 0) + p.totalNums);
        }
        return [...acc.entries()].map(([name, value]) => ({name, value}));
    }
    const list: Array<{name: string; value: number}> = [];
    for (const p of projects) {
        const {province} = parseAddress(p.address);
        /** 与下钻后 payload.name（如 `广东省`）一致即可；子级 Geo 里只有市面，没有省名。 */
        if (province !== currentProvinceName) {
            continue;
        }
        for (const [cityKey, v] of Object.entries(p.city)) {
            const cityName =
                nameFromAdcodeInGeo(geo, cityKey) ?? matchRegionNameInGeo(geo, cityKey);
            if (cityName != null) {
                list.push({name: cityName, value: v});
            }
        }
    }
    return withProvinceBarHeights(mergeByName(list));
}

/**
 * 全国 GeoJSON 通常只有省界，市级 adcode 无法命中 `nameFromAdcodeInGeo` 时作展示用（可随业务扩充）。
 */
const CITY_NAME_BY_ADCODE: Record<string, string> = {
    "440100": "广州市",
    "440300": "深圳市",
    "440600": "佛山市",
    "441900": "东莞市",
    "330100": "杭州市",
    "330200": "宁波市",
    "330300": "温州市",
    "320100": "南京市",
    "320200": "无锡市",
    "320400": "常州市",
    "320500": "苏州市",
    "370100": "济南市",
    "370200": "青岛市",
    "370600": "烟台市"
};

function cityLabelFor2DTooltip(geo: ChinaGeoJSON, key: string): string {
    const fromGeo = nameFromAdcodeInGeo(geo, key);
    if (fromGeo) {
        return fromGeo;
    }
    const digits = key.replace(/\D/g, "");
    if (digits.length >= 6) {
        const six = digits.slice(0, 6);
        const fromTable = CITY_NAME_BY_ADCODE[six];
        if (fromTable) {
            return fromTable;
        }
    }
    const fromName = matchRegionNameInGeo(geo, key);
    if (fromName) {
        return fromName;
    }
    return key;
}

export type ECharts2DMapToolRow = {
    name: string;
    value: number;
    areas: string[];
};

/**
 * 全国 2D 地图：`totalNums` 按 `address` 省汇总；`tooltip`/`柱线气泡` 用 `city` 拼市明细（adcode 解析名 + 回退表）。
 */
export function buildECharts2DMapFromProjects(
    geo: ChinaGeoJSON,
    projects: ProjectMapItem[]
): {mapData: Array<{name: string; value: number}>; toolRows: ECharts2DMapToolRow[]} | null {
    if (projects.length === 0) {
        return null;
    }
    const acc = new Map<string, {total: number; cities: Map<string, number>}>();
    for (const p of projects) {
        const {province} = parseAddress(p.address);
        if (!province) {
            continue;
        }
        const n = matchRegionNameInGeo(geo, province);
        if (n == null) {
            continue;
        }
        const row = acc.get(n) ?? {total: 0, cities: new Map<string, number>()};
        row.total += p.totalNums;
        for (const [k, v] of Object.entries(p.city)) {
            row.cities.set(k, (row.cities.get(k) ?? 0) + v);
        }
        acc.set(n, row);
    }
    if (acc.size === 0) {
        return null;
    }
    const toolRows: ECharts2DMapToolRow[] = [];
    for (const [provName, {total, cities}] of acc) {
        const parts: {label: string; n: number}[] = [];
        for (const [k, v] of cities) {
            parts.push({label: `${cityLabelFor2DTooltip(geo, k)} ${v}个`, n: v});
        }
        parts.sort((a, b) => b.n - a.n);
        toolRows.push({
            name: provName,
            value: total,
            areas: parts.map((x) => x.label)
        });
    }
    toolRows.sort((a, b) => b.value - a.value);
    const valMap = new Map(toolRows.map((t) => [t.name, t.value] as const));
    const mapData = geo.features
        .map((f) => {
            const n = f.properties?.name;
            if (typeof n !== "string" || n.length === 0) {
                return null;
            }
            return {name: n, value: valMap.get(n) ?? 0};
        })
        .filter((x): x is {name: string; value: number} => x != null);
    return {mapData, toolRows};
}

export function mapDataValueRange(
    data: Array<{name: string; value: number}>
): {min: number; max: number} {
    if (data.length === 0) {
        return {min: 0, max: 1};
    }
    const vals = data.map((d) => d.value);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    if (minV === maxV) {
        return {min: minV, max: minV + 1};
    }
    return {min: minV, max: maxV};
}

/** 与 ECharts `setOption(…, false, true)` 合并，用于在不下钻/不重载 Geo 时只更新项目热力层。 */
export function buildMapProjectLayerPartialOption(
    mapData: Map3DProjectDatum[]
): {
    visualMap: Record<string, unknown>;
    series: Array<{
        data: Map3DProjectDatum[];
        postEffect: Record<string, unknown>;
    }>;
} {
    const {min, max} = mapDataValueRange(mapData);
    const hasPillars = mapData.length > 0 && mapData.some((d) => d.height != null);
    /** 光柱下钻时 Bloom 强一些；仅省级填色时轻 Bloom 勾轮廓（大屏感） */
    const provincePillarGlow = hasPillars
        ? {enable: true, bloom: {enable: true, intensity: 0.24, threshold: 0.34, radius: 4.5}}
        : mapData.length > 0
          ? {enable: true, bloom: {enable: true, intensity: 0.11, threshold: 0.58, radius: 3.2}}
          : {enable: true, bloom: {enable: false}};
    if (mapData.length === 0) {
        return {
            visualMap: {show: false, seriesIndex: 0},
            series: [{data: [], postEffect: {enable: true, bloom: {enable: false}}}]
        };
    }
    return {
        visualMap: {
            id: "projectVolume",
            type: "continuous",
            show: true,
            min,
            max,
            calculable: true,
            realtime: true,
            seriesIndex: 0,
            right: 14,
            bottom: 32,
            itemWidth: 14,
            itemHeight: 128,
            /** 深靛 → 电青 → 浅金，贴近常见 3D 中国大屏 */
            inRange: {color: ["#06121f", "#0c4a6e", "#0891b2", "#22d3ee", "#fbbf24", "#fde68a"]},
            textStyle: {color: "rgba(186, 211, 230, 0.88)", fontSize: 11}
        },
        series: [{data: mapData, postEffect: provincePillarGlow}]
    };
}
