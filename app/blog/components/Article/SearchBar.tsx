"use client"
import React, { Ref, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CircleX, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchBarProps extends BaseComponentProps {
  ref?: Ref<HTMLInputElement>
  defaultValue?: {
    keyword: string
    type: string
  }
  placeholder?: string
  searchTypeList?: Array<{ label: string; value: string }>
  cleared?: boolean
  onClear?: () => void
  onSearch?: (params: { keyword: string; type: string; label?: string }) => void
}

const defaultSearchTypes = [
  {
    label: "标题",
    value: "title",
  },
  {
    label: "标签",
    value: "tag",
  },
]

export default function SearchBar({
  cleared = true,
  placeholder,
  defaultValue,
  searchTypeList,
  className,
  style,
  ref,
  onSearch,
  onClear,
}: SearchBarProps) {
  const [params, setParams] = useState({
    keyword: defaultValue?.keyword ?? "",
    type: defaultValue?.type ?? "title",
  })
  const [searchTypes] = useState(searchTypeList ?? defaultSearchTypes)
  const router = useRouter()

  const showClear = useMemo(() => params.keyword && cleared, [params.keyword, cleared])

  const paramsChange = useCallback(
    (key: string, value: string) => {
      setParams({
        ...params,
        [key]: value,
      })
    },
    [setParams, params]
  )

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch({
        ...params,
        label: searchTypes.find((item) => item.value === params.type)?.label,
      })
    } else {
      const { keyword, type } = params
      router.push(`/blog/article/list?${type}=${keyword}`)
    }
  }, [onSearch, params])

  const handleClear = useCallback(() => {
    paramsChange("keyword", "")
    onClear?.()
  }, [onClear])

  return (
    <div
      style={style}
      className={cn("flex-center border-input overflow-hidden rounded-lg border border-solid", className)}
    >
      <Select defaultValue={params.type} onValueChange={(v) => paramsChange("type", v)}>
        <SelectTrigger className="border-input rounded-none border-r border-none border-solid shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={"search-options"}>
          {searchTypes.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className={`relative flex min-w-37 flex-1 flex-shrink-1 items-center pr-7 pl-1`}>
        <input
          ref={ref}
          value={params.keyword}
          className={"h-full max-w-full flex-1 outline-none"}
          placeholder={placeholder || "请输入关键词搜索"}
          onChange={(e) => paramsChange("keyword", e.target.value)}
        />
        {showClear && (
          <CircleX className={"absolute right-1 size-5 cursor-pointer text-gray-500"} onClick={handleClear} />
        )}
      </div>
      <Button
        className={"border-input rounded-none border-l border-solid"}
        variant={"ghost"}
        type={"button"}
        onClick={handleSearch}
      >
        <Search />
      </Button>
    </div>
  )
}
