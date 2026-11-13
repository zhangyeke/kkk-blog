
"use client";

import { useCallback } from "react";
import { AsyncCascader } from "@/components/ui/async-cascader";
import { loadRegionCascaderData, type RegionCascaderOption } from "@/service/china-map";

type Region = RegionCascaderOption;

export interface RegionCascaderProps extends BaseComponentProps {
  value: string[];
  placeholder?: string;
  onChange: (value: string[]) => void;
  getOptionValue: (option: Region) => string;
  getOptionLabel: (option: Region) => string;
  valueLabelMap?: Readonly<Record<string, string>>;
  allowParentSelection?: boolean;
  minParentSelectionDepth?: number;
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
