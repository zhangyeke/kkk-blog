/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-24 17:06:16
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-30 14:02:32
 * @FilePath: \blog\app\blog\map\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import type { Metadata } from "next";
import { footprintRowsToProjectMapItems } from "@/lib/map-project-data";
import { getAllFootprints } from "@/service/footprint";
import { ChinaEChartsMap } from "./ChinaEChartsMap";

export const metadata: Metadata = {
    title: "旅行足迹"
};

/**
 * 数据来自当前登录用户足迹；`province` / `city` 为 DataV GeoJSON `properties.adcode` 一致的六位码。
 * 全国按省汇总；下钻后按市级 adcode 累加。
 */

export default async function Page() {
    const res = await getAllFootprints();
    const projects =
        res.code === 200 && Array.isArray(res.data?.list)
            ? footprintRowsToProjectMapItems(res.data.list)
            : [];

    return (
        <div className="h-screen ">
            <ChinaEChartsMap projects={projects} />
        </div>
    );
}
