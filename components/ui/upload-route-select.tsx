"use client"

import React from "react"

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { UPLOAD_ROUTES, type UploadRouteId } from "@/lib/image-upload-routes"
import { cn } from "@/lib/utils"

interface UploadRouteSelectProps {
    value: UploadRouteId
    onChange: (value: UploadRouteId) => void
    disabled?: boolean
    className?: string
    contentClassName?: string

}

/** 图床线路选择：所有图片上传入口共用，避免各处各写一套 */
export function UploadRouteSelect({ value, onChange, disabled, className, contentClassName }: UploadRouteSelectProps) {
    // 不用 Radix 的 SelectValue：它在弹层首次展开前拿不到选中项文案，触发器会是空白的
    const current = UPLOAD_ROUTES.find((option) => option.id === value)

    return (
        <Select
            value={value}
            disabled={disabled}
            onValueChange={(next) => onChange(next as UploadRouteId)}

        >
            <SelectTrigger size="sm" aria-label="上传线路" className={cn("h-7 w-auto gap-1 px-2 text-xs", className)}>
                <span data-slot="select-value">{current?.label ?? "选择线路"}</span>
            </SelectTrigger>
            <SelectContent position="popper" align="end" className={contentClassName}>
                {UPLOAD_ROUTES.map((option) => (
                    <SelectItem key={option.id} value={option.id} className="text-xs">
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
