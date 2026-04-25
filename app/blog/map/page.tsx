/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-24 17:06:16
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-25 18:07:16
 * @FilePath: \blog\app\blog\map\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { Metadata } from "next";
import type { ProjectMapItem } from "@/lib/map-project-data";
import { ChinaEChartsMap } from "./ChinaEChartsMap";

export const metadata: Metadata = {
    title: "中国项目分布图"
};

/**
 * 示例：`provinceAdcode` / `cityAdcode` 与阿里云 DataV
 * `https://geo.datav.aliyun.com/areas_v3/bound/{adcode}_full.json` 的 `properties.adcode` 对齐。
 * 全国层用 `totalNums` 按 `address` 中的省汇总；下钻后 `city` 的 **键为区划 adcode**（与 DataV `properties.adcode` 一致）。
 */
const _prjData: ProjectMapItem[] = [
    {
        id: 1,
        address: "广东省广州市",
        provinceAdcode: "440000",
        cityAdcode: "440100",
        totalNums: 186,
        city: { 440100: 72, 440300: 55, 440600: 35, 441900: 24 }
    },
    {
        id: 2,
        address: "浙江省杭州市",
        provinceAdcode: "330000",
        cityAdcode: "330100",
        totalNums: 98,
        city: { 330100: 42, 330200: 31, 330300: 25 }
    },
    {
        id: 3,
        address: "江苏省南京市",
        provinceAdcode: "320000",
        cityAdcode: "320100",
        totalNums: 142,
        city: { 320100: 48, 320500: 52, 320200: 28, 320400: 14 }
    },
    {
        id: 4,
        address: "山东省济南市",
        provinceAdcode: "370000",
        cityAdcode: "370100",
        totalNums: 76,
        city: { 370100: 28, 370200: 30, 370600: 18 }
    }
];

export default function Page() {
    return (
        <div className="w-full  header-padding">
            <ChinaEChartsMap projects={_prjData} />
        </div>
    );
}
