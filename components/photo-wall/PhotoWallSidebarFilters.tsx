"use client"

import { Search } from "lucide-react"

import { AsyncCascader } from "@/components/ui/async-cascader"
import { Input } from "@/components/ui/input"
import { loadRegionCascaderData, type RegionCascaderOption } from "@/service/china-map"

const getRegionValue = (region: RegionCascaderOption) => region.id
const getRegionLabel = (region: RegionCascaderOption) => region.name

interface PhotoWallSidebarFiltersProps {
  locationQuery: string
  onLocationQueryChange: (value: string) => void
  regionPath: string[]
  regionValueLabelMap?: Readonly<Record<string, string>>
  onRegionChange: (path: string[]) => void
}

export function PhotoWallSidebarFilters({
  locationQuery,
  onLocationQueryChange,
  regionPath,
  regionValueLabelMap,
  onRegionChange,
}: PhotoWallSidebarFiltersProps) {
  return (
    <div className="bg-background shrink-0 border-b border-[var(--pw-hair)] px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <label className="grid min-w-0 gap-1.5">
          <span className="text-xs text-[var(--pw-ink-3)]">地点</span>
          <span className="relative block">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              value={locationQuery}
              onChange={(event) => onLocationQueryChange(event.target.value)}
              placeholder="搜索地点…"
              aria-label="搜索地点"
              className="h-9 rounded-lg pl-9 text-sm"
            />
          </span>
        </label>

        <div className="grid min-w-0 gap-1.5">
          <span className="text-xs text-[var(--pw-ink-3)]">地区</span>
          <AsyncCascader<RegionCascaderOption>
            loadData={loadRegionCascaderData}
            value={regionPath}
            valueLabelMap={regionValueLabelMap}
            onChange={onRegionChange}
            getOptionValue={getRegionValue}
            getOptionLabel={getRegionLabel}
            placeholder="全部地区"
            allowParentSelection
            minParentSelectionDepth={1}
            className="h-9 w-full rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  )
}
