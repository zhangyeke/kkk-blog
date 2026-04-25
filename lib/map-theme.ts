import type {CSSProperties} from "react";

/**
 * 独立「地图产品」皮肤，不跟随站点 `themes.primary`。
 * 视觉参考：ECharts 图表集等常见 **数据大屏/3D 中国** —— 深靛底、冷青高亮边线、
 * 轻 Bloom、暗色网格与四角 HUD 装饰；与 isqqw 等 gallery 的 map3D 作品气质接近。
 */
export type MapEChartsColors = {
    tooltip: {text: string; background: string; border: string};
    title: {
        text: string;
        sub: string;
        /** 标题主字外发光，模拟大屏霓虹字 */
        textShadow: string;
        textShadowBlur: number;
    };
    series: {
        environment: string;
        ground: string;
        itemColor: string;
        borderColor: string;
        shadowColor: string;
        emphasisColor: string;
        labelText: string;
        labelBackground: string;
    };
};

const MAP_ECHARTS: MapEChartsColors = {
    tooltip: {
        text: "#e8f0f8",
        background: "rgba(8, 15, 32, 0.94)",
        border: "rgba(34, 211, 238, 0.4)"
    },
    title: {
        text: "#f0f9ff",
        sub: "rgba(148, 200, 230, 0.82)",
        textShadow: "rgba(6, 182, 212, 0.55)",
        textShadowBlur: 18
    },
    series: {
        environment: "rgba(4, 8, 18, 0.55)",
        ground: "rgba(6, 16, 36, 0.62)",
        itemColor: "#1a2f4d",
        borderColor: "rgba(34, 211, 238, 0.72)",
        shadowColor: "rgba(6, 182, 212, 0.35)",
        emphasisColor: "#2d4f7a",
        labelText: "#0a1628",
        labelBackground: "rgba(240, 249, 255, 0.95)"
    }
};

export function getMapEChartsColors(): MapEChartsColors {
    return MAP_ECHARTS;
}

/**
 * 仅颜色相关字段，用于对已有 chart 做 merge 更新（如后续换「浅色底图」皮肤）。
 */
export function getMapEchartsOptionColorPatch(
    c: MapEChartsColors,
    _scope: "country" | "province"
) {
    void _scope;
    return {
        tooltip: {
            textStyle: {color: c.tooltip.text},
            backgroundColor: c.tooltip.background,
            borderColor: c.tooltip.border
        },
        title: {
            textStyle: {
                color: c.title.text,
                textShadowColor: c.title.textShadow,
                textShadowBlur: c.title.textShadowBlur,
                textShadowOffsetY: 0
            },
            subtextStyle: {color: c.title.sub}
        },
        series: [
            {
                environment: c.series.environment,
                groundPlane: {
                    show: true,
                    color: c.series.ground
                },
                itemStyle: {
                    color: c.series.itemColor,
                    borderColor: c.series.borderColor,
                    shadowColor: c.series.shadowColor
                },
                emphasis: {
                    label: {
                        show: true,
                        color: c.series.labelText,
                        backgroundColor: c.series.labelBackground,
                        padding: [4, 8] as [number, number],
                        borderRadius: 4
                    },
                    itemStyle: {
                        color: c.series.emphasisColor
                    }
                }
            }
        ]
    };
}

export function getMapPageBackground(): string {
    return `
    radial-gradient(ellipse 100% 70% at 50% 0%, rgba(14, 165, 233, 0.12), transparent 50%),
    radial-gradient(ellipse 50% 40% at 0% 100%, rgba(59, 130, 246, 0.08), transparent 45%),
    linear-gradient(175deg, #040812 0%, #0a1224 45%, #02040a 100%)
  `
        .replace(/\s+/g, " ")
        .trim();
}

export function getMapChartContainerStyle(): CSSProperties {
    return {
        borderColor: "rgba(34, 211, 238, 0.28)",
        background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(8, 47, 73, 0.45), transparent 55%), linear-gradient(180deg, #061018 0%, #02060c 100%)",
        boxShadow:
            "0 0 0 1px rgba(34, 211, 238, 0.12) inset, 0 0 40px rgba(6, 182, 212, 0.08) inset, 0 32px 80px rgba(0,0,0,0.55)"
    };
}

export function getMapLensPanelStyle(): CSSProperties {
    return {
        borderColor: "rgba(71, 85, 105, 0.65)",
        background: "rgba(15, 23, 42, 0.9)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
    };
}

export function getMapAccentButtonStyle(
    _variant: "default" | "strong" = "default"
): CSSProperties {
    void _variant;
    return {
        borderColor: "rgba(56, 189, 248, 0.38)",
        background: "rgba(56, 189, 248, 0.09)",
        color: "#e0f2fe"
    };
}

export function getMapBackButtonStyle(): CSSProperties {
    return {
        borderColor: "rgba(100, 116, 139, 0.55)",
        background: "rgba(30, 41, 59, 0.75)",
        color: "#e2e8f0"
    };
}

export function getMapHintTextStyle(): CSSProperties {
    return {color: "rgba(148, 163, 184, 0.72)"};
}

export function getMapSoftLabelColor(): string {
    return "rgba(148, 163, 184, 0.88)";
}

/** 可交互控件：焦点环（天蓝，与线划色一致） */
export const mapControlFocusClass =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400/80 focus-visible:outline-offset-2";
