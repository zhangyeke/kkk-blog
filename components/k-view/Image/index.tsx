"use client"
import React from "react"
import {Avatar, AvatarFallback, AvatarImage} from "../../ui/avatar";
import {cn} from "@/lib/utils";
import {Skeleton} from "@/components/ui/skeleton"

export type ImageProps = React.ComponentProps<typeof AvatarImage> & {
    fallback?: React.ReactNode
}

export function Image(props: ImageProps) {
    const {className, fallback, ...imageProps} = props;
    const [status, setStatus] = React.useState('loading')

    const Fallback = React.useCallback(() => {
        if (fallback) return <AvatarFallback>{fallback}</AvatarFallback>

        return <AvatarImage className={'size-full'} src={'/images/placeholder/image_error.png'} alt={"加载失败"}/>
    }, [fallback])
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
