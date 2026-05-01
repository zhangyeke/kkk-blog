/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 23:10:04
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-28 00:46:12
 * @FilePath: \blog\components\k-view\RegionCascader\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

"use client";

import { useCallback, useState } from "react";
import { AsyncCascader } from "@/components/ui/async-cascader";
import { loadRegionCascaderData, type RegionCascaderOption } from "@/service/china-map";

type Region = RegionCascaderOption;

export interface RegionCascaderProps extends BaseComponentProps {
  value: string[];
  placeholder?: string;
  onChange: (value: string[]) => void;
  getOptionValue: (option: Region) => string;
  getOptionLabel: (option: Region) => string;
}

export function RegionCascader(props: RegionCascaderProps) {

  const loadData = useCallback(async (pathPrefix: string[]) => {
    return loadRegionCascaderData(pathPrefix);
  }, []);

  return (
    <AsyncCascader<Region> 
      {...props}
      loadData={loadData}
    />
  );
}
