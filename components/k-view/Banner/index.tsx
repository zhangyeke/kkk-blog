"use client"
import "./mask.style.css"
import {AnimationEventHandler, useCallback, useEffect, useMemo, useState} from "react";
import {cn, getDeepValue, sleep} from "@/lib/utils"


export interface BannerProps<T> extends BaseComponentProps {
    duration?: number//动画持续时间
    delay?: number//图片切换间隔
    list: T[]
    imageKey?: string
}

export function Banner<T>(props: BannerProps<T>) {
    const {duration = 2500, delay = 5000, list, imageKey = 'url', className, style} = props
    /*当前显示图片索引*/
    const [currentIndex, setCurrentIndex] = useState(0)
    /*是否播放动画*/
    const [isPlay, setIsPlay] = useState(false)

    const [refreshKey, setRefreshKey] = useState(0)


    // 最大索引值
    const maxIndex = useMemo(() => list.length - 1, [list])

    const getImageUrl = useCallback((item?: T | string) => {
        if (typeof item === 'string') return item
        return getDeepValue(item, imageKey)
    }, [imageKey])

    const currentImageStyle = useMemo(() => {
        const item = list[currentIndex]
        return {
            backgroundImage: `url(${getImageUrl(item)})`,
        }
    }, [list, currentIndex])

    const nextImageStyle = useMemo(() => {
        const i = currentIndex >= maxIndex ? 0 : currentIndex + 1
        const item = list[i]
        return {
            '--duration': `${duration}ms`,
            animationPlayState: isPlay ? 'running' : 'paused',
            backgroundImage: `url(${getImageUrl(item)})`,
        }
    }, [isPlay, list, currentIndex])

    const changeNextImage = useCallback(() => {
        setRefreshKey(Date.now())
        const i = currentIndex + 1
        const isMax = i > maxIndex
        if (isMax) {
            setCurrentIndex(0)
        } else {
            setCurrentIndex(i)
        }
    }, [currentIndex, maxIndex])


    const handleAnimationEnd: AnimationEventHandler<HTMLDivElement> = useCallback(async (e) => {
        if (e.animationName === 'maskMove') {
            await sleep(delay)
            changeNextImage()
        }
    }, [changeNextImage])

    useEffect(() => {
        setTimeout(() => {
            setIsPlay(true)
        }, delay)
    }, []);


    return (
        <div className={cn('relative h-[500px]', className)} style={style} key={refreshKey}>
            <div
                style={currentImageStyle}
                className="bg-cover bg-center bg-no-repeat size-full "
            ></div>
            <div
                style={nextImageStyle}
                className="mask-bg absolute inset-0 size-full bg-cover  bg-center "
                onAnimationEnd={handleAnimationEnd}
            ></div>
        </div>
    )
}
