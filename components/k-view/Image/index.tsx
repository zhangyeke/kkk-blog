/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 14:03:18
 * @FilePath: \blog\components\k-view\Image\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React from "react"
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton"

export type ImageProps = React.ComponentProps<typeof AvatarImage> & {
    fallback?: React.ReactNode
    /** 默认 cover（裁切填满）；contain 则按比例完整显示在容器内（可能留边）。 */
    objectFit?: "cover" | "contain"
}

/** 未传 `loading` 时默认为 `lazy`（原生懒加载）。 */
export function Image(props: ImageProps) {
    const { className, fallback, loading = "lazy", objectFit = "cover", ...imageProps } = props;
    const [status, setStatus] = React.useState('loading')

    const Fallback = React.useCallback(() => {
        if (fallback) {
            return (
                <span
                    className={'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs'}>{fallback}</span>
            )
        }

        return <AvatarImage className={'size-full'} src={'/images/placeholder/image_error.png'} alt={"加载失败"} />
    }, [fallback])


    if (!imageProps.src) {
        return (
            <Avatar className={className}>
                <Fallback />
            </Avatar>
        )
    }

    return (
        <Avatar className={className}>
            <AvatarImage
                {...imageProps}
                loading={loading}
                className={cn(
                    objectFit === "contain"
                        ? "size-full max-h-full max-w-full object-contain aspect-auto"
                        : "object-cover",
                    status !== "loaded" && "hidden"
                )}
                onLoadingStatusChange={setStatus}
            />
            {
                status === 'loading' && <Skeleton className={'size-full'} />
            }
            {
                status === 'error' && <Fallback />
            }

        </Avatar>
    )
}
