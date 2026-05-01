/** 与 DataV / ECharts 常用 GeoJSON 结构兼容 */
export type ChinaGeoJSON = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties?: {name?: string; adcode?: number; [key: string]: unknown} | null;
        geometry: object;
    }>;
};

export type ChinaMapScope = "country" | "province";

export type ChinaMapPayload =
    | {
          scope: "country";
          adcode: null;
          parentAdcode: null;
          name: "中国";
          geo: ChinaGeoJSON;
      }
    | {
          scope: "province";
          adcode: number;
          parentAdcode: number;
          name: string;
          geo: ChinaGeoJSON;
      };
