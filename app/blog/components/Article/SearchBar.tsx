"use client"
import React, {useCallback, useState} from "react"
import {useRouter} from "next/navigation"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Search} from "lucide-react";
import {cn} from "@/lib/utils";


interface SearchBarProps extends BaseComponentProps {
    onSearch?: (params: { keyword: string, type: string }) => void
    defaultValue?: {
        keyword: string,
        type: string
    }
}

export default function SearchBar({defaultValue, className, style, onSearch}: SearchBarProps) {
    const [params, setParams] = useState({
        keyword: defaultValue?.keyword ?? "",
        type: defaultValue?.type ?? "title"
    })
    const router = useRouter();
    const paramsChange = useCallback((key: string, value: string) => {
        setParams({
            ...params,
            [key]: value
        })
    }, [setParams, params])

    const handleSearch = useCallback(() => {
        if (onSearch) {
            onSearch(params)
        } else {
            const {keyword, type} = params
            router.push(`/blog/article/list?${type}=${keyword}`)
        }

    }, [onSearch, params])

    return (
        <div
            style={style}
            className={cn("overflow-hidden flex-center rounded-lg border border-solid border-input", className)}>
            <Select
                defaultValue={params.type}
                onValueChange={(v) => paramsChange('type', v)}
            >
                <SelectTrigger
                    className="border-none shadow-none border-r border-input border-solid rounded-none"
                >
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="title">标题</SelectItem>
                    <SelectItem value="tags">标签</SelectItem>
                </SelectContent>
            </Select>
            <input
                defaultValue={params.keyword}
                className={'flex-1 h-full outline-none pl-1'}
                placeholder={'请输入关键词搜索'}
                onChange={(e) => paramsChange('keyword', e.target.value)}
            />
            <Button
                className={'border-l border-input border-solid rounded-none'}
                variant={'ghost'}
                type={'button'}
                onClick={handleSearch}
            ><Search/></Button>
        </div>
    )
}
