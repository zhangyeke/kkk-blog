/**
 * 照片地图的展示模型。
 *
 * 数据源是 Footprint（一个地点一组照片），坐标存 WGS-84；
 * `displayLng/displayLat` 是换算到目标底图坐标系后的结果（境内 GCJ-02、境外 WGS-84）。
 */

export type PhotoMapPoint = {
    /** Footprint.id */
    id: number
    /** 景点/地点标题，来自 address */
    title: string
    /** 省 / 市 / 区名称，供预览画廊展示 */
    location: {
        provinceName: string
        cityName: string
        districtName: string
    }
    /** 原始坐标（WGS-84），用于调试与未来换底图 */
    lng: number
    lat: number
    /** 换算后的坐标，直接喂给地图 */
    displayLng: number
    displayLat: number
    /** 封面图，取 album 第一张 */
    cover: string | null
    /** 该地点的照片总数 */
    photoCount: number
    /** 全部照片，点击后进灯箱 */
    photos: string[]
}

/** 地图视野内的聚合结果，供渲染用 */
export type PhotoMapCluster = {
    key: string
    x: number
    y: number
    points: PhotoMapPoint[]
}
