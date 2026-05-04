import type {Footprint} from "@prisma/client";
import type {ChinaGeoJSON} from "@/types/china-map";

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
    /** 区县 adcode（`Footprint.area`），与市级 GeoJSON 中区县级面一致 */
    areaAdcode?: string;
    /** 全国视图中按「省」整省汇总展示（如广东省一块） */
    totalNums: number;
    /**
     * 下钻到该省后：键为 **6 位 adcode**（与 GeoJSON `properties.adcode` 一致，如 `440100`），值为数量。
     * 也兼容旧数据：键为区划中文名时仍按 `name` 匹配。
     */
    city: Record<string, number>;
    /** 足迹相册图片 URL，下钻市级点击时汇总展示 */
    album?: string[];
};

export type MapGalleryItem = { id: string; url: string };

/** 单张图及其所属足迹的唯一 address（一条足迹只有一个 address） */
export type MapGalleryImageItem = {
    url: string;
    address: string;
};

/** 地图下钻点击后传给画廊的行政区划文案 */
export type MapGalleryLocationMeta = {
    provinceName: string;
    cityName: string;
    districtName: string;
};

/** 画廊条目（URL 去重保留首次）+ 省/市/区展示用 */
export type MapRegionGalleryPayload = {
    items: MapGalleryImageItem[];
    location: MapGalleryLocationMeta;
};

function padSixAdcode(n: number): string {
    const s = `${Math.trunc(n)}`.replace(/\D/g, "");
    return s.length >= 6 ? s.slice(0, 6) : s.padStart(6, "0");
}

function normalizeAdcodeString(s: string): string | null {
    const d = s.replace(/\D/g, "");
    if (d.length === 0) {
        return null;
    }
    return d.length >= 6 ? d.slice(0, 6) : d.padStart(6, "0");
}

/**
 * 同属一个地级政区时常共前 4 位（例：阿坝州 513200 与下属县；成都 510100 与武侯 510107），
 * 便于点击地市/州多边形仍能命中仅填区县码的足迹。
 */
function adcodesRoughlySameAdminUnit(regionSix: string, candidate: string): boolean {
    const a = normalizeAdcodeString(regionSix);
    const b = normalizeAdcodeString(candidate);
    if (a == null || b == null) {
        return false;
    }
    if (a === b) {
        return true;
    }
    return a.slice(0, 4) === b.slice(0, 4);
}

function albumImageCountForMap(p: ProjectMapItem): number {
    if (!Array.isArray(p.album)) {
        return 0;
    }
    let n = 0;
    for (const u of p.album) {
        if (typeof u === "string" && u.trim().length > 0) {
            n += 1;
        }
    }
    return n;
}

/** 将 Prisma 足迹行转为地图展示用结构；每条足迹视为 1 次数，同省/市在聚合层累加。 */
export function footprintRowsToProjectMapItems(rows: Footprint[]): ProjectMapItem[] {
    return rows.map((f) => {
        const provinceAdcode = padSixAdcode(f.province);
        const cityAdcode = padSixAdcode(f.city);
        const areaAdcode =
            f.area != null && Number.isFinite(Number(f.area)) ? padSixAdcode(Number(f.area)) : undefined;
        return {
            id: f.id,
            address: f.address ?? "",
            provinceAdcode,
            cityAdcode,
            areaAdcode,
            totalNums: 1,
            city: {[cityAdcode]: 1},
            album: Array.isArray(f.album) ? f.album : []
        };
    });
}

/** 优先用 `address` 解析省名；若无则按 `provinceAdcode` 与当前 GeoJSON 面匹配。 */
export function resolveProvinceLabel(geo: ChinaGeoJSON, p: ProjectMapItem): string | null {
    const {province} = parseAddress(p.address);
    if (province) {
        return matchRegionNameInGeo(geo, province);
    }
    if (p.provinceAdcode) {
        return nameFromAdcodeInGeo(geo, p.provinceAdcode);
    }
    return null;
}

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

/** 从地址串尽量解析省 / 市 / 区（县），用于画廊副标题等展示。 */
export function parseAddressParts(address: string): {
    province: string;
    city: string;
    district: string;
} {
    const t = address.trim();
    if (!t) {
        return {province: "", city: "", district: ""};
    }
    for (const {p: prov, re} of MUNI) {
        if (re.test(t)) {
            const tail = t.slice(prov.length);
            const dm = tail.match(/^(.+?区|.+?县|.+?旗|.+?市)/u);
            return {province: prov, city: prov, district: dm ? dm[1]! : ""};
        }
    }
    const m3 = t.match(
        /^(.+?省|.+?自治区)(.+?市|.+?州|.+?盟)(.+?区|.+?县|.+?旗|.+?市)/u
    );
    if (m3) {
        return {province: m3[1]!, city: m3[2]!, district: m3[3]!};
    }
    const base = parseAddress(t);
    return {province: base.province, city: base.city, district: ""};
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
 * 与 GeoJSON 中区县/地市名称对齐，取 6 位 adcode（供下钻点击与足迹 city 匹配）。
 */
export function findAdcodeForRegionName(geo: ChinaGeoJSON, rawName: string): string | null {
    const k = matchRegionNameInGeo(geo, rawName) ?? rawName;
    for (const f of geo.features) {
        const p = f.properties;
        if (p == null || typeof p.name !== "string" || p.name.length === 0) {
            continue;
        }
        if (p.name === k || p.name === rawName) {
            const ac = p.adcode;
            if (ac == null) {
                return null;
            }
            const ad = typeof ac === "number" ? String(ac) : String(ac).replace(/\D/g, "");
            if (ad.length !== 6) {
                return null;
            }
            return ad;
        }
    }
    return null;
}

function isProjectInDrilledProvince(
    p: ProjectMapItem,
    currentProvinceAdcode: string,
    currentProvinceName: string,
    geo: ChinaGeoJSON
): boolean {
    const drillProv = normalizeAdcodeString(currentProvinceAdcode);
    let inThisProvince = false;
    if (drillProv && p.provinceAdcode) {
        const pa = normalizeAdcodeString(p.provinceAdcode);
        if (pa != null && pa === drillProv) {
            inThisProvince = true;
        }
    }
    if (!inThisProvince) {
        const provLabel = resolveProvinceLabel(geo, p);
        inThisProvince = provLabel != null && provLabel === currentProvinceName;
    }
    return inThisProvince;
}

/** 省下钻后点击某区县/市：匹配足迹；每张图绑定**该足迹唯一** `address`；URL 去重保留首次。 */
export function buildRegionGalleryForDrilledClick(
    projects: ProjectMapItem[],
    geo: ChinaGeoJSON,
    provinceCtx: { adcode: string; name: string },
    clickedRegionName: string
): MapRegionGalleryPayload | null {
    const regionAdcode = findAdcodeForRegionName(geo, clickedRegionName);
    const hitName = matchRegionNameInGeo(geo, clickedRegionName) ?? clickedRegionName;
    const matched: ProjectMapItem[] = [];
    const seenUrl = new Set<string>();
    const items: MapGalleryImageItem[] = [];

    for (const p of projects) {
        if (!isProjectInDrilledProvince(p, provinceCtx.adcode, provinceCtx.name, geo)) {
            continue;
        }
        const album = p.album;
        if (!album || album.length === 0) {
            continue;
        }
        let rowMatch = false;
        if (regionAdcode != null) {
            if (p.cityAdcode && adcodesRoughlySameAdminUnit(regionAdcode, p.cityAdcode)) {
                rowMatch = true;
            }
            if (!rowMatch && p.areaAdcode && adcodesRoughlySameAdminUnit(regionAdcode, p.areaAdcode)) {
                rowMatch = true;
            }
            if (!rowMatch) {
                for (const key of Object.keys(p.city)) {
                    if (adcodesRoughlySameAdminUnit(regionAdcode, key)) {
                        rowMatch = true;
                        break;
                    }
                }
            }
        }
        if (!rowMatch && regionAdcode == null) {
            const {city} = parseAddress(p.address ?? "");
            if (city.length > 0) {
                const cResolved = matchRegionNameInGeo(geo, city) ?? city;
                rowMatch =
                    cResolved === hitName ||
                    hitName.includes(cResolved) ||
                    cResolved.includes(hitName.replace(/市$/u, ""));
            }
        }
        if (!rowMatch) {
            continue;
        }
        matched.push(p);
        const addr = (p.address ?? "").trim();
        for (const url of album) {
            if (typeof url === "string" && url.length > 0 && !seenUrl.has(url)) {
                seenUrl.add(url);
                items.push({url, address: addr});
            }
        }
    }

    if (items.length === 0) {
        return null;
    }

    const provinceName = provinceCtx.name;
    let cityName = "";
    let districtName = "";

    const districtLike = /(区|县|旗|自治县|自治旗|林区)$/.test(hitName);
    const cityLike =
        hitName.endsWith("市") || hitName.endsWith("州") || hitName.endsWith("盟");

    if (districtLike) {
        districtName = hitName;
        const a0 = matched[0]?.address;
        if (a0) {
            cityName = parseAddressParts(a0).city;
        }
    } else if (cityLike) {
        cityName = hitName;
    } else {
        cityName = hitName;
    }

    if (!cityName && matched[0]?.address) {
        cityName = parseAddressParts(matched[0].address).city;
    }

    return {
        items,
        location: {
            provinceName,
            cityName,
            districtName
        }
    };
}

/** @deprecated 仅保留兼容；请优先使用 `buildRegionGalleryForDrilledClick`。 */
export function collectGalleryItemsForDrilledRegion(
    projects: ProjectMapItem[],
    geo: ChinaGeoJSON,
    provinceCtx: { adcode: string; name: string },
    clickedRegionName: string
): MapGalleryItem[] {
    const built = buildRegionGalleryForDrilledClick(projects, geo, provinceCtx, clickedRegionName);
    if (!built) {
        return [];
    }
    return built.items.map((it, i) => ({id: `map-gallery-${i}`, url: it.url}));
}

/**
 * 把业务数据变成 ECharts `map3D` 的 `series.data` + visualMap 用的数值表。
 *
 * - **全国** (`scope === "country"`)：按 **省** 汇总，用 `totalNums`；`name` 与省级面名称一致（如 `广东省`）。
 * - **省级** (`scope === "province"`)：只处理当前省数据；对每个地级面累加该区划相关足迹的 **`album` 图片张数**（无图足迹不参与柱/热力），便于气泡与画册一致。
 *   区级 adcode（`city` 键、`cityAdcode`、`areaAdcode`）映射为与下级 GeoJSON 面一致的 `name`。
 */
export function buildMap3DDataFromProjects(
    geo: ChinaGeoJSON,
    projects: ProjectMapItem[],
    scope: "country" | "province",
    currentProvinceName: string,
    currentProvinceAdcode?: string
): Map3DProjectDatum[] {
    if (projects.length === 0) {
        return [];
    }
    if (scope === "country") {
        const acc = new Map<string, number>();
        for (const p of projects) {
            const n = resolveProvinceLabel(geo, p);
            if (n == null) {
                continue;
            }
            acc.set(n, (acc.get(n) ?? 0) + p.totalNums);
        }
        return [...acc.entries()].map(([name, value]) => ({name, value}));
    }
    const list: Array<{name: string; value: number}> = [];
    const drillProv = currentProvinceAdcode ? normalizeAdcodeString(currentProvinceAdcode) : null;

    for (const p of projects) {
        let inThisProvince = false;
        if (drillProv && p.provinceAdcode) {
            const pa = normalizeAdcodeString(p.provinceAdcode);
            if (pa != null && pa === drillProv) {
                inThisProvince = true;
            }
        }
        if (!inThisProvince) {
            const provLabel = resolveProvinceLabel(geo, p);
            inThisProvince = provLabel != null && provLabel === currentProvinceName;
        }
        if (!inThisProvince) {
            continue;
        }
        const imgs = albumImageCountForMap(p);
        if (imgs < 1) {
            continue;
        }
        for (const [cityKey] of Object.entries(p.city)) {
            const cityName =
                nameFromAdcodeInGeo(geo, cityKey) ?? matchRegionNameInGeo(geo, cityKey);
            if (cityName != null) {
                list.push({name: cityName, value: imgs});
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

/** 全国聚合同一「市/地级」维度去重（优先 6 位 adcode）。 */
function dedupCityKeyForNationalAgg(rawKey: string): string {
    const six = normalizeAdcodeString(rawKey);
    if (six != null) {
        return `a:${six}`;
    }
    const t = rawKey.trim();
    return t.length > 0 ? `n:${t}` : "";
}

export type ECharts2DMapToolRow = {
    name: string;
    value: number;
    areas: string[];
};

/**
 * 全国 2D 地图：柱顶气泡与填色 `value` = **该省有相册图的地级市个数**（去重）；
 * `areas` 为各市「名称 + 张数」列表。无图足迹不参与。
 */
export function buildECharts2DMapFromProjects(
    geo: ChinaGeoJSON,
    projects: ProjectMapItem[]
): {mapData: Array<{name: string; value: number}>; toolRows: ECharts2DMapToolRow[]} | null {
    if (projects.length === 0) {
        return null;
    }
    /** 省 -> 市去重键 -> 展示名 + 累计张数 */
    const acc = new Map<string, Map<string, {label: string; photos: number}>>();
    for (const p of projects) {
        const provName = resolveProvinceLabel(geo, p);
        if (provName == null) {
            continue;
        }
        const imgs = albumImageCountForMap(p);
        if (imgs < 1) {
            continue;
        }
        const keys = Object.keys(p.city);
        const primaryRaw =
            (p.cityAdcode != null && `${p.cityAdcode}`.trim().length > 0
                ? String(p.cityAdcode)
                : undefined) ?? keys[0];
        if (primaryRaw == null || primaryRaw.length === 0) {
            continue;
        }
        const dk = dedupCityKeyForNationalAgg(primaryRaw);
        if (dk.length === 0) {
            continue;
        }
        const label = cityLabelFor2DTooltip(geo, primaryRaw);
        let cityMap = acc.get(provName);
        if (cityMap == null) {
            cityMap = new Map();
            acc.set(provName, cityMap);
        }
        const prev = cityMap.get(dk) ?? {label, photos: 0};
        prev.photos += imgs;
        if (!prev.label) {
            prev.label = label;
        }
        cityMap.set(dk, prev);
    }
    if (acc.size === 0) {
        return null;
    }
    const toolRows: ECharts2DMapToolRow[] = [];
    for (const [provName, cityMap] of acc) {
        const parts = [...cityMap.values()]
            .map(({label, photos}) => ({label: `${label} ${photos}张`, n: photos}))
            .sort((a, b) => b.n - a.n);
        toolRows.push({
            name: provName,
            value: cityMap.size,
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
