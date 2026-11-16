/**
 * 旅行照片墙的数据契约。
 *
 * 数据源是 `Footprint`（一条足迹 = 一个地点 + 一组照片），
 * 这里把它归一化成展示用的 `PhotoSpot`，省/市/区名称在构建阶段补齐。
 */

/** 一个地点的一组照片 */
export type PhotoSpot = {
    id: number
    /** 展示标题：优先用 Footprint.address，缺失时回落到「{城市名}的足迹」 */
    title: string
    provinceCode: string
    provinceName: string
    cityCode: string
    cityName: string
    /** 区县 adcode；旧数据或未精确到区县时为空 */
    districtCode?: string | null
    /** 区县名，解析不出时为空串（UI 自动省略该段） */
    districtName: string
    /** 已过滤空串并去重的图片地址 */
    photos: string[]
    createdAt: string
}

/** 省 → 市 两级分组，供列表渲染 */
export type PhotoCityGroup = {
    cityCode: string
    cityName: string
    spots: PhotoSpot[]
}

export type PhotoProvinceGroup = {
    provinceCode: string
    provinceName: string
    cities: PhotoCityGroup[]
    /** 该省下的地点数，用于省分组标题右侧统计 */
    spotCount: number
    photoCount: number
}

/** 地图筛选条件 */
export type PhotoFilter = {
    provinceCode: string | null
    cityCode: string | null
    districtCode?: string | null
}
