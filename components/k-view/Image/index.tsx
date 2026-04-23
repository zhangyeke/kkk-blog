"use client"
import React from "react"
import {cn} from "@/lib/utils";
import {Avatar, AvatarImage} from "@/components/ui/avatar";
import {Skeleton} from "@/components/ui/skeleton"

export type ImageProps = React.ComponentProps<typeof AvatarImage> & {
    fallback?: React.ReactNode
}

export function Image(props: ImageProps) {
    const {className, fallback, ...imageProps} = props;
    const [status, setStatus] = React.useState('loading')

    const Fallback = React.useCallback(() => {
        if (fallback) {
            return (
                <span
                    className={'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs'}>{fallback}</span>
            )
        }

        return <AvatarImage className={'size-full'} src={'/images/placeholder/image_error.png'} alt={"加载失败"}/>
    }, [fallback])


    if (!imageProps.src) {
        return (
            <Avatar className={className}>
                <Fallback/>
            </Avatar>
        )
    }

    return (
        <Avatar className={className}>
            <AvatarImage
                {...imageProps}
                className={cn('object-cover ', status !== 'loaded' && 'hidden')}
                onLoadingStatusChange={setStatus}
            />
            {
                status === 'loading' && <Skeleton className={'size-full'}/>
            }
            {
                status === 'error' && <Fallback/>
            }

        </Avatar>
    )
}
