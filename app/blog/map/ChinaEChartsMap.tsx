"use client";
import { env } from "env.mjs"
import { useCallback, useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { ChinaGeoJSON } from "@/types/china-map";
import { getChinaMapPayload } from "@/service/china-map";
import {
    buildECharts2DMapFromProjects,
    buildMap3DDataFromProjects,
    buildRegionGalleryForDrilledClick,
    matchRegionNameInGeo,
    type MapRegionGalleryPayload,
    type ProjectMapItem
} from "@/lib/map-project-data";
import { Button } from "@/components/ui/button";
import { GalleryModal } from "@/components/GalleryModal";
import { Hamster } from "@/components/k-view/Loader/Hamster";
import { ArrowBigLeftDash } from "lucide-react";
const MAP_COUNTRY_KEY = "china" as const;

const LAYOUT_COUNTRY = "180%";
const LAYOUT_PROVINCE = "150%";

/** 全国图：光柱顶与气泡共用的纬度偏移（柱/泡同一数值才相接） */
const PILLAR_TOP_OFFSET_LAT = 2.35;
/** 下钻省图：更矮，避免线顶在放大比例下“捅穿”气泡图 */
const PILLAR_TOP_OFFSET_LAT_PROVINCE = 0.45;
/** 与下方 scatter.symbolSize[1] 一致，底对齐柱顶时向上移半高（像素） */
const PILLAR_BUBBLE_H = 58;
const PILLAR_BUBBLE_W = 118;
/**
 * 相对「半高」的额外 Y 偏移（px，正值 = 气泡略下移、贴近柱顶/补偿 PNG 下留白）。
 * 全国柱加高时若补偿过大，线体易顶入蓝框“穿过”观感，宜略小；出现缝则 +1～2。
 */
const PILLAR_COUNTRY_BUBBLE_OFFSET_Y = 12;
const PILLAR_PROVINCE_BUBBLE_OFFSET_Y = 4;

/** 柱顶气泡标签（与 label formatter 文案一致）估算宽度，避免长地名裁切；与 rich.padding 左右约 14px 对齐。 */
function pillarBubbleSymbolWidth(it: ToolTipRow): number {
    const label = `${it.name} : ${it.value}个`;
    let px = 0;
    for (const ch of label) {
        px += /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 13 : ch === " " ? 4 : 8;
    }
    return Math.min(520, Math.max(PILLAR_BUBBLE_W, px + 32));
}

function toolTipRowFromScatterValue(raw: unknown): ToolTipRow | undefined {
    if (!Array.isArray(raw) || raw.length < 3) {
        return undefined;
    }
    const t = raw[2];
    if (t != null && typeof t === "object" && "name" in t && "value" in t) {
        return t as ToolTipRow;
    }
    return undefined;
}

const DEFAULT_PROJECTS: ProjectMapItem[] = [];

const MAP_AREA_GRADIENT = {
    type: "linear" as const,
    x: 1200,
    y: 0,
    x2: 0,
    y2: 0,
    colorStops: [
        { offset: 0, color: "rgba(3,27,78,0.75)" },
        { offset: 1, color: "rgba(58,149,253,0.75)" }
    ],
    global: true
};

const MAP_SERIES_DATA: { name: string; value: number }[] = [
    { name: "北京", value: 5 },
    { name: "天津", value: 14 },
    { name: "河北", value: 157 },
    { name: "山西", value: 110 },
    { name: "内蒙古", value: 40 },
    { name: "辽宁", value: 40 },
    { name: "吉林", value: 40 },
    { name: "黑龙江", value: 60 },
    { name: "上海", value: 10 },
    { name: "江苏", value: 60 },
    { name: "浙江", value: 50 },
    { name: "安徽", value: 151 },
    { name: "福建", value: 60 },
    { name: "江西", value: 74 },
    { name: "山东", value: 200 },
    { name: "河南", value: 100 },
    { name: "湖北", value: 40 },
    { name: "湖南", value: 50 },
    { name: "重庆", value: 40 },
    { name: "四川", value: 120 },
    { name: "贵州", value: 135 },
    { name: "云南", value: 90 },
    { name: "西藏", value: 25 },
    { name: "陕西", value: 100 },
    { name: "甘肃", value: 60 },
    { name: "青海", value: 20 },
    { name: "宁夏", value: 110 },
    { name: "新疆", value: 32 },
    { name: "广东", value: 10 },
    { name: "广西", value: 100 },
    { name: "海南", value: 40 }
];

export type ToolTipRow = { name: string; value: number; areas: string[] };



const BASE_GEO_COORD: Record<string, [number, number]> = {
    黑龙江: [127.9688, 45.368],
    内蒙古: [110.3467, 41.4899],
    吉林: [125.8154, 44.2584],
    北京市: [116.4551, 40.2539],
    辽宁: [123.1238, 42.1216],
    河北: [114.4995, 38.1006],
    天津: [117.4219, 39.4189],
    山西: [112.3352, 37.9413],
    陕西: [109.1162, 34.2004],
    甘肃: [103.5901, 36.3043],
    宁夏: [106.3586, 38.1775],
    青海: [101.4038, 36.8207],
    新疆: [87.611053, 43.828171],
    西藏: [91.117212, 29.646922],
    四川: [103.9526, 30.7617],
    重庆: [108.384366, 30.439702],
    山东: [117.1582, 36.8701],
    河南: [113.4668, 34.6234],
    江苏: [118.8062, 31.9208],
    安徽: [117.29, 32.0581],
    湖北: [114.3896, 30.6628],
    浙江: [119.5313, 29.8773],
    福建: [119.4543, 25.9222],
    江西: [116.0046, 28.6633],
    湖南: [113.0823, 28.2568],
    贵州: [106.6992, 26.7682],
    云南: [102.9199, 25.4663],
    广东: [113.12244, 23.009505],
    广西: [108.479, 23.1152],
    海南: [110.3893, 19.8516],
    台湾: [120.702967, 24.123621],
    上海: [121.4648, 31.2891]
};

function buildCoordMap(geo: ChinaGeoJSON): Record<string, [number, number]> {
    const m: Record<string, [number, number]> = {};
    for (const [k, c] of Object.entries(BASE_GEO_COORD)) {
        const n = matchRegionNameInGeo(geo, k) ?? k;
        m[n] = c;
        m[k] = c;
    }
    for (const f of geo.features) {
        const p = f.properties as { name?: string; cp?: number[]; centroid?: number[] } | null;
        if (p == null || !p.name) {
            continue;
        }
        const arr = p.cp ?? p.centroid;
        if (Array.isArray(arr) && arr.length >= 2) {
            const a0 = arr[0];
            const a1 = arr[1];
            if (typeof a0 === "number" && typeof a1 === "number") {
                m[p.name] = [a0, a1];
            }
        }
    }
    return m;
}

function pickCoord(
    m: Record<string, [number, number]>,
    geo: ChinaGeoJSON,
    short: string
): [number, number] | undefined {
    const k = matchRegionNameInGeo(geo, short) ?? short;
    return m[k] ?? m[short];
}

function alignMapData(geo: ChinaGeoJSON) {
    return MAP_SERIES_DATA.map((d) => {
        const n = matchRegionNameInGeo(geo, d.name);
        return n ? { name: n, value: d.value } : null;
    }).filter((x): x is { name: string; value: number } => x != null);
}

function lineDataRows(
    geo: ChinaGeoJSON,
    m: Record<string, [number, number]>,
    rows: ToolTipRow[],
    topOffsetLat: number
) {
    return rows
        .map((item) => {
            const c = pickCoord(m, geo, item.name);
            if (!c) {
                return null;
            }
            return {
                coords: [c, [c[0], c[1] + topOffsetLat] as [number, number]] as [
                    [number, number],
                    [number, number]
                ]
            };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);
}

function scatterTops(
    geo: ChinaGeoJSON,
    m: Record<string, [number, number]>,
    rows: ToolTipRow[],
    topOffsetLat: number
) {
    return rows
        .map((item) => {
            const c = pickCoord(m, geo, item.name);
            if (!c) {
                return null;
            }
            return [c[0], c[1] + topOffsetLat, item] as [number, number, ToolTipRow];
        })
        .filter((x): x is [number, number, ToolTipRow] => x != null);
}

function convertDataEffect(geo: ChinaGeoJSON, m: Record<string, [number, number]>, rows: ToolTipRow[]) {
    return rows.map((item) => {
        const c = pickCoord(m, geo, item.name);
        if (!c) {
            return null;
        }
        const nm = matchRegionNameInGeo(geo, item.name) ?? item.name;
        return {
            name: nm,
            value: [c[0], c[1], item.value] as [number, number, number]
        };
    }).filter((x): x is { name: string; value: [number, number, number] } => x != null);
}

function findClickedProvince(
    geo: ChinaGeoJSON,
    rawName: string
): { adcode: string; name: string } | null {
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
            return { adcode: ad, name: p.name };
        }
    }
    return null;
}

function provinceMapKey(adcode: string) {
    return `prov_${adcode}`;
}

/**
 * 与 `.header-padding` 同源：沿用 `--header-height`。外层用 `header-padding` + 绝对定位铺满整屏高度，
 * 再用 layoutCenter 下移等效像素，使绘制区与顶栏留白对齐。
 */
function layoutCenterYpct(el: HTMLElement, baseVerticalPercent: number): string {
    const raw = getComputedStyle(el).getPropertyValue("--header-height").trim();
    const headerPx = Number.parseFloat(raw) || 64;
    const h = Math.max(el.clientHeight, 1);
    return `${baseVerticalPercent + (headerPx / h) * 100}%`;
}

type MapDrillView = { level: "country" } | { level: "province"; adcode: string; name: string };

type ChinaEChartsMapProps = {
    projects?: ProjectMapItem[];
    onProvinceClick?: (name: string, coord: [number, number]) => void;
};

const MAP_GALLERY_LAYOUT_ID = "echarts-map-region-gallery";

export function ChinaEChartsMap({ projects = DEFAULT_PROJECTS, onProvinceClick }: ChinaEChartsMapProps = {}) {
    const elRef = useRef<HTMLDivElement | null>(null);
    const onClickRef = useRef(onProvinceClick);
    onClickRef.current = onProvinceClick;
    const mapDrillRef = useRef<MapDrillView>({ level: "country" });
    const openMapGalleryRef = useRef<(payload: MapRegionGalleryPayload) => void>(() => { });
    const [err, setErr] = useState<string | null>(null);
    const [mapDrill, setMapDrill] = useState<MapDrillView>({ level: "country" });
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
    const [galleryImageAddresses, setGalleryImageAddresses] = useState<string[]>([]);
    const [galleryDefaultIndex, setGalleryDefaultIndex] = useState(0);
    const [galleryLocation, setGalleryLocation] = useState<MapRegionGalleryPayload["location"] | null>(
        null
    );
    const [mapLoading, setMapLoading] = useState(true);

    const handleGalleryBackdrop = useCallback(() => {
        setGalleryOpen(false);
        setGalleryLocation(null);
        setGalleryImageAddresses([]);
    }, []);

    const handleGalleryCloseButton = useCallback(() => {
        setGalleryOpen(false);
        setGalleryLocation(null);
        setGalleryImageAddresses([]);
    }, []);

    const openMapGallery = useCallback((payload: MapRegionGalleryPayload) => {
        if (payload.items.length === 0) {
            return;
        }
        setGalleryUrls(payload.items.map((it) => it.url));
        setGalleryImageAddresses(payload.items.map((it) => it.address));
        setGalleryLocation(payload.location);
        setGalleryDefaultIndex(0);
        setGalleryOpen(true);
    }, []);

    openMapGalleryRef.current = openMapGallery;

    const drillKey = mapDrill.level === "country" ? "c" : `p-${mapDrill.adcode}`;
    mapDrillRef.current = mapDrill;

    useEffect(() => {

        const el = elRef.current;
        if (!el) {
            return;
        }
        let off = false;
        const ch = echarts.init(el);
        setMapLoading(true);
        (async () => {
            if (!off) {
                setErr(null);
            }
            const isCountry = mapDrill.level === "country";
            const mapKey = isCountry ? MAP_COUNTRY_KEY : provinceMapKey(mapDrill.adcode);
            const layoutSize = isCountry ? LAYOUT_COUNTRY : LAYOUT_PROVINCE;
            let geo: ChinaGeoJSON | undefined;
            let payloadName: string | undefined;
            try {
                const payload = await getChinaMapPayload(
                    isCountry ? "country" : "province",
                    isCountry ? undefined : mapDrill.adcode
                );
                geo = payload.geo;
                payloadName = payload.name;
                if (off) {
                    return;
                }
                echarts.registerMap(mapKey, geo as Parameters<typeof echarts.registerMap>[1]);
            } catch (e) {
                if (!off) {
                    setErr(e instanceof Error ? e.message : "地图加载失败");
                    setMapLoading(false);
                }
                return;
            }
            if (off || !geo) {
                if (!off) {
                    setMapLoading(false);
                }
                return;
            }

            const m = buildCoordMap(geo);
            let markRows: ToolTipRow[];
            let mapData: Array<{ name: string; value: number }>;
            if (isCountry) {
                const fromPrj = buildECharts2DMapFromProjects(geo, projects);
                markRows = fromPrj ? fromPrj.toolRows : [];
                mapData = fromPrj ? fromPrj.mapData : alignMapData(geo);
            } else {
                const provinceLabel = payloadName ?? mapDrill.name;
                const cityDatums = buildMap3DDataFromProjects(
                    geo,
                    projects,
                    "province",
                    provinceLabel,
                    mapDrill.adcode
                );
                const valMap = new Map(cityDatums.map((d) => [d.name, d.value]));
                mapData = geo.features
                    .map((f) => {
                        const n = f.properties?.name;
                        if (typeof n !== "string" || n.length === 0) {
                            return null;
                        }
                        return { name: n, value: valMap.get(n) ?? 0 };
                    })
                    .filter((x): x is { name: string; value: number } => x != null);
                markRows = cityDatums.map((d) => ({ name: d.name, value: d.value, areas: [] }));
            }
            const pillarTopLat = isCountry ? PILLAR_TOP_OFFSET_LAT : PILLAR_TOP_OFFSET_LAT_PROVINCE;
            const linesD = lineDataRows(geo, m, markRows, pillarTopLat);
            const topsD = scatterTops(geo, m, markRows, pillarTopLat);
            const effectRows = [...markRows]
                .filter((r) => r.value > 0)
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);
            const effectD = convertDataEffect(geo, m, effectRows);
            const pillarSymbol = `image://${env.NEXT_PUBLIC_API_URL}/images/mark_border_bg.png`;
            const scatterBubbleOffY =
                -PILLAR_BUBBLE_H / 2 +
                (isCountry ? PILLAR_COUNTRY_BUBBLE_OFFSET_Y : PILLAR_PROVINCE_BUBBLE_OFFSET_Y);

            const titleText = isCountry ? "项目分布图" : `${payloadName ?? mapDrill.name} · 项目分布`;

            const geoMainLayer: echarts.GeoComponentOption = {
                layoutCenter: ["50%", layoutCenterYpct(el, 50)],
                layoutSize,
                show: true,
                map: mapKey,
                /**
                 * 全国：roam 由带 geoIndex 的 map 系列处理（与官方示例一致）；
                 * 下钻：map 系列叠在 geo 上，仅 series.map.roam 时滚轮/拖拽易被多层 geo + replaceMerge 打断，改为在 geo[0] 上 roam，并令 map 系列 silent 让命中穿到 geo。
                 */
                roam: !isCountry,
                ...(isCountry
                    ? {}
                    : {
                        scaleLimit: { min: 0.2, max: 12 }
                    }),
                zoom: 0.65,
                aspectScale: 1,
                label: { show: false, color: "#fff" },
                itemStyle: {
                    areaColor: MAP_AREA_GRADIENT,
                    borderColor: "#c0f3fb",
                    borderWidth: 1,
                    shadowColor: "#8cd3ef",
                    shadowOffsetY: 10,
                    shadowBlur: 120
                },
                emphasis: {
                    label: { show: true, color: "#fff" },
                    itemStyle: { areaColor: "rgba(0,254,233,0.6)" }
                }
            };
            const geo3DStackLayers: echarts.GeoComponentOption[] = [
                {
                    type: "map",
                    map: mapKey,
                    zlevel: -1,
                    aspectScale: 1,
                    zoom: 0.65,
                    layoutCenter: ["50%", layoutCenterYpct(el, 51)],
                    layoutSize,
                    roam: false,
                    silent: true,
                    animationDurationUpdate: 0,
                    itemStyle: {
                        borderWidth: 1,
                        borderColor: "rgba(58,149,253,0.8)",
                        shadowColor: "rgba(172, 122, 255,0.5)",
                        shadowOffsetY: 5,
                        shadowBlur: 15,
                        areaColor: "rgba(5,21,35,0.1)"
                    }
                },
                {
                    type: "map",
                    map: mapKey,
                    zlevel: -2,
                    aspectScale: 1,
                    zoom: 0.65,
                    layoutCenter: ["50%", layoutCenterYpct(el, 52)],
                    layoutSize,
                    roam: false,
                    silent: true,
                    animationDurationUpdate: 0,
                    itemStyle: {
                        borderWidth: 1,
                        borderColor: "rgba(58,149,253,0.6)",
                        shadowColor: "rgba(65, 214, 255,1)",
                        shadowOffsetY: 5,
                        shadowBlur: 15,
                        areaColor: "transparent"
                    }
                },
                {
                    type: "map",
                    map: mapKey,
                    zlevel: -3,
                    aspectScale: 1,
                    zoom: 0.65,
                    layoutCenter: ["50%", layoutCenterYpct(el, 53)],
                    layoutSize,
                    roam: false,
                    silent: true,
                    animationDurationUpdate: 0,
                    itemStyle: {
                        borderWidth: 1,
                        borderColor: "rgba(58,149,253,0.4)",
                        shadowColor: "rgba(58,149,253,1)",
                        shadowOffsetY: 15,
                        shadowBlur: 10,
                        areaColor: "transparent"
                    }
                },
                {
                    type: "map",
                    map: mapKey,
                    zlevel: -4,
                    aspectScale: 1,
                    zoom: 0.65,
                    layoutCenter: ["50%", layoutCenterYpct(el, 54)],
                    layoutSize,
                    roam: false,
                    silent: true,
                    animationDurationUpdate: 0,
                    itemStyle: {
                        borderWidth: 5,
                        borderColor: "rgba(5,9,57,0.8)",
                        shadowColor: "rgba(29, 111, 165,0.8)",
                        shadowOffsetY: 15,
                        shadowBlur: 10,
                        areaColor: "rgba(5,21,35,0.1)"
                    }
                }
            ];
            const geoList: echarts.GeoComponentOption[] = [geoMainLayer, ...geo3DStackLayers];

            const option: echarts.EChartsOption = {
                backgroundColor: "#003366",
                title: {
                    show: true,
                    text: titleText,
                    left: "center",
                    top: 10,
                    textStyle: {
                        color: "#ffce44",
                        fontFamily: "等线",
                        fontSize: 18
                    }
                },
                tooltip: {
                    trigger: "item",
                    backgroundColor: "#fff",
                    borderColor: "#ffce44",
                    padding: [5, 10],
                    textStyle: { color: "#333", fontSize: 16 },
                    formatter: (p) => {
                        const o = (Array.isArray(p) ? p[0] : p) as { name?: string };
                        return o.name ?? "";
                    }
                },
                geo: geoList,
                series: [
                    {
                        type: "map",
                        map: mapKey,
                        geoIndex: 0,
                        aspectScale: 1,
                        zoom: 0.65,
                        showLegendSymbol: true,
                        roam: isCountry,
                        /**
                         * 下钻为 true 时，事件由 geo[0] 接管 roam；设 silent 避免上层 map 抢命中
                         * （与 scatter/line 的 silent 同思路）
                         */
                        silent: !isCountry,
                        label: { show: true, color: "#fff", fontSize: 14 },
                        emphasis: { label: { show: true } },
                        itemStyle: {
                            areaColor: MAP_AREA_GRADIENT,
                            borderColor: "#fff",
                            borderWidth: 0.2
                        },
                        layoutCenter: ["50%", layoutCenterYpct(el, 50)],
                        layoutSize,
                        animation: false,
                        markPoint: { symbol: "none" },
                        data: mapData
                    },
                    {
                        name: "Top 5",
                        type: "effectScatter",
                        coordinateSystem: "geo",
                        geoIndex: 0,
                        data: effectD,
                        showEffectOn: "render",
                        rippleEffect: { scale: 5, brushType: "stroke" },
                        label: { formatter: "{b}", position: "bottom", show: false, color: "#fff", distance: 10 },
                        symbol: "circle",
                        symbolSize: [20, 10],
                        itemStyle: {
                            color: "#16ffff",
                            shadowBlur: 10,
                            shadowColor: "#16ffff"
                        },
                        /** 不抢命中，让平移/滚轮缩放下报到 map（省图标注多时尤其明显） */
                        silent: true,
                        zlevel: 3
                    },
                    {
                        type: "lines",
                        coordinateSystem: "geo",
                        geoIndex: 0,
                        zlevel: 4,
                        effect: { show: false, symbolSize: 5 },
                        lineStyle: {
                            width: 5,
                            color: "rgba(230, 150, 90, 0.85)",
                            opacity: 1,
                            curveness: 0
                        },
                        label: { show: false, position: "end" },
                        silent: true,
                        data: linesD
                    },
                    {
                        type: "scatter",
                        coordinateSystem: "geo",
                        geoIndex: 0,
                        zlevel: 5,
                        label: {
                            show: true,
                            color: "#fff",
                            position: "inside",
                            distance: 0,
                            overflow: "none",
                            textAlign: "center",
                            verticalAlign: "middle",
                            formatter: (par) => {
                                const d = par.data;
                                if (!Array.isArray(d) || d.length < 3) {
                                    return "";
                                }
                                const it = d[2] as unknown as ToolTipRow;
                                return `{row|${it.name} : ${it.value}个}`;
                            },
                            rich: {
                                row: {
                                    color: "#fff",
                                    fontSize: 13,
                                    lineHeight: 20,
                                    align: "center",
                                    padding: [4, 14, 4, 14]
                                }
                            }
                        },
                        emphasis: { label: { show: true } },
                        itemStyle: { color: "#00FFF6", opacity: 1 },
                        symbol: pillarSymbol,
                        symbolSize: (rawValue: unknown, params: { data?: { value?: unknown } }) => {
                            const it =
                                toolTipRowFromScatterValue(rawValue) ??
                                toolTipRowFromScatterValue(params?.data?.value);
                            if (!it) {
                                return [PILLAR_BUBBLE_W, PILLAR_BUBBLE_H] as [number, number];
                            }
                            return [pillarBubbleSymbolWidth(it), PILLAR_BUBBLE_H] as [number, number];
                        },
                        /**
                         * 以柱顶地理点为锚点；省图对底图+PNG 下留白补 px，与 lines 端点对齐
                         */
                        symbolOffset: [0, scatterBubbleOffY],
                        /** 与 effectScatter 相同：大图符否则会挡住 map 的 roam（拖拽/滚轮） */
                        silent: true,
                        z: 10,
                        data: topsD
                    }
                ] as echarts.SeriesOption[]
            };

            ch.setOption(option);

            const onGeoRoam = () => {
                const raw = ch.getOption() as { geo?: echarts.GeoComponentOption | echarts.GeoComponentOption[] };
                const g = raw.geo;
                const geos = Array.isArray(g) ? g : g != null ? [g] : [];
                if (geos.length < 2) {
                    return;
                }
                const g0 = geos[0] as { center?: [number, number]; zoom?: number };
                const { center, zoom } = g0;
                if (center == null && zoom == null) {
                    return;
                }
                /** 勿用 replaceMerge:['geo']：每次 georoam 会整表替换 geo，打断正进行的平移/滚轮缩放 */
                ch.setOption(
                    {
                        geo: geos.map((g, i) => {
                            if (i === 0) {
                                return g;
                            }
                            return {
                                ...g,
                                ...(center != null ? { center } : {}),
                                ...(zoom != null ? { zoom } : {}),
                                animationDurationUpdate: 0
                            };
                        })
                    },
                    { lazyUpdate: true, silent: true }
                );
            };
            ch.on("georoam", onGeoRoam);

            ch.on("click", (params) => {
                if (
                    isCountry &&
                    params.componentType === "series" &&
                    params.seriesType === "map" &&
                    typeof params.name === "string"
                ) {
                    const hit = findClickedProvince(geo, params.name);
                    if (hit) {
                        setMapDrill({ level: "province", adcode: hit.adcode, name: hit.name });
                        return;
                    }
                }
                if (
                    !isCountry &&
                    params.componentType === "series" &&
                    params.seriesType === "map" &&
                    typeof params.name === "string"
                ) {
                    const md = mapDrillRef.current;
                    if (md.level === "province") {
                        const payload = buildRegionGalleryForDrilledClick(
                            projects,
                            geo,
                            { adcode: md.adcode, name: md.name },
                            params.name
                        );
                        if (payload) {
                            openMapGalleryRef.current(payload);
                            return;
                        }
                    }
                }
                const c = params.name ? m[params.name] : undefined;
                if (params.name && c) {
                    onClickRef.current?.(params.name, c);
                }
            });
            if (!off) {
                setMapLoading(false);
            }
        })();

        const onResize = () => ch.resize();
        window.addEventListener("resize", onResize);
        return () => {
            off = true;
            window.removeEventListener("resize", onResize);
            setMapLoading(false);
            ch.dispose();
        };
    }, [projects, drillKey]);

    return (
        <div className="relative flex h-full min-h-0 w-full flex-col">
            {mapDrill.level === "province" ? (
                <Button
                    className="absolute left-6 top-[var(--header-height)] mt-2 z-10"
                    onClick={() => setMapDrill({ level: "country" })}
                >
                    <ArrowBigLeftDash />返回
                </Button>
            ) : null}
            {err ? <p className="text-destructive relative z-10 shrink-0 p-4 text-sm">{err}</p> : null}
            <div className="relative box-border flex min-h-0 w-full flex-1 flex-col overflow-hidden header-padding">
                {mapLoading ? (
                    <div className="pointer-events-none absolute inset-0 z-[5] flex-center flex-col bg-background/60">
                        <Hamster />
                        <span className="mt-2">正在努力加载中...</span>
                    </div>
                ) : null}
                <div
                    ref={elRef}
                    className="absolute bottom-0 left-0 right-0 top-[calc(-1*var(--header-height))] w-full"
                />
            </div>
            {galleryUrls.length > 0 ? (
                <GalleryModal
                    isOpen={galleryOpen}
                    onBackdropClick={handleGalleryBackdrop}
                    onCloseButtonClick={handleGalleryCloseButton}
                    uniqueId={MAP_GALLERY_LAYOUT_ID}
                    urls={galleryUrls}
                    defaultIndex={galleryDefaultIndex}
                    locationMeta={galleryLocation ?? undefined}
                    imageAddresses={
                        galleryImageAddresses.length === galleryUrls.length
                            ? galleryImageAddresses
                            : undefined
                    }
                />
            ) : null}
        </div>
    );
}
