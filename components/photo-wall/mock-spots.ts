import type { PhotoSpot } from "@/types/photo-wall"

/**
 * 静态设计稿用的假数据。
 * 覆盖：多省多市、多图/单图、长标题、区县缺失、同城多地点。
 * 图片走 picsum 固定 seed，保证每次渲染一致。
 */
function photos(spotId: number, count: number): string[] {
    return Array.from(
        {length: count},
        (_, i) => `https://picsum.photos/seed/pw-${spotId}-${i + 1}/1200/800`,
    )
}

export const MOCK_SPOTS: PhotoSpot[] = [
    {
        id: 1,
        title: "西湖 · 断桥残雪",
        provinceCode: "330000",
        provinceName: "浙江省",
        cityCode: "330100",
        cityName: "杭州市",
        districtName: "西湖区",
        photos: photos(1, 5),
        createdAt: "2026-04-02T09:12:00.000Z",
    },
    {
        id: 2,
        title: "灵隐寺",
        provinceCode: "330000",
        provinceName: "浙江省",
        cityCode: "330100",
        cityName: "杭州市",
        districtName: "西湖区",
        photos: photos(2, 3),
        createdAt: "2026-04-03T10:30:00.000Z",
    },
    {
        id: 3,
        title: "东钱湖",
        provinceCode: "330000",
        provinceName: "浙江省",
        cityCode: "330200",
        cityName: "宁波市",
        districtName: "鄞州区",
        photos: photos(3, 1),
        createdAt: "2026-04-05T16:00:00.000Z",
    },
    {
        id: 4,
        title: "黄山风景区 · 光明顶",
        provinceCode: "340000",
        provinceName: "安徽省",
        cityCode: "341000",
        cityName: "黄山市",
        districtName: "黄山区",
        photos: photos(4, 6),
        createdAt: "2026-05-11T05:40:00.000Z",
    },
    {
        id: 5,
        title: "宏村",
        provinceCode: "340000",
        provinceName: "安徽省",
        cityCode: "341000",
        cityName: "黄山市",
        districtName: "黟县",
        photos: photos(5, 4),
        createdAt: "2026-05-12T14:20:00.000Z",
    },
    {
        id: 6,
        title: "大蜀山森林公园",
        provinceCode: "340000",
        provinceName: "安徽省",
        cityCode: "340100",
        cityName: "合肥市",
        districtName: "蜀山区",
        photos: photos(6, 3),
        createdAt: "2026-06-01T08:00:00.000Z",
    },
    {
        id: 7,
        title: "包公园",
        provinceCode: "340000",
        provinceName: "安徽省",
        cityCode: "340100",
        cityName: "合肥市",
        districtName: "包河区",
        photos: photos(7, 2),
        createdAt: "2026-06-02T15:10:00.000Z",
    },
    {
        id: 8,
        title: "成都大熊猫繁育研究基地 · 月亮产房",
        provinceCode: "510000",
        provinceName: "四川省",
        cityCode: "510100",
        cityName: "成都市",
        districtName: "成华区",
        photos: photos(8, 6),
        createdAt: "2026-07-18T07:25:00.000Z",
    },
    {
        id: 9,
        title: "宽窄巷子",
        provinceCode: "510000",
        provinceName: "四川省",
        cityCode: "510100",
        cityName: "成都市",
        districtName: "青羊区",
        photos: photos(9, 4),
        createdAt: "2026-07-19T20:05:00.000Z",
    },
    {
        id: 10,
        title: "乐山大佛",
        provinceCode: "510000",
        provinceName: "四川省",
        cityCode: "511100",
        cityName: "乐山市",
        // 故意留空，验证「区县缺失时自动省略该段」
        districtName: "",
        photos: photos(10, 3),
        createdAt: "2026-07-21T11:45:00.000Z",
    },
]
