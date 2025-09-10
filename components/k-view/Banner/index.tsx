"use client"
import React from "react"
import Autoplay from "embla-carousel-autoplay";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel"
import {Image} from "@/components/k-view"

export interface BannerProps<T> extends React.ComponentProps<typeof Carousel> {
    list: T[] | string[];
    imageKey?: keyof T
    imageClass?: string
    autoplay?: boolean;
    delay?: number;
}

export function Banner<T>(props: BannerProps<T>) {
    const {list, imageKey, imageClass, autoplay = true, delay = 3000, ...carouselProps} = props;
    // 2. 将插件实例的创建放入一个 ref 中
    const plugin = React.useRef(
        Autoplay({
            delay: delay,
            stopOnInteraction: true,
        })
    );
    return (
        <Carousel {...carouselProps} plugins={autoplay ? [plugin.current] : []}>
            <CarouselContent>
                {list.map((item, index) => {
                    let imageSrc = ''
                    if (typeof item === 'string') {
                        imageSrc = item;
                    }
                    // 2. 关键改动：在使用 imageKey 之前，先检查它是否存在
                    else if (imageKey && item[imageKey]) {
                        imageSrc = item[imageKey] as string; // as string 告诉 TS 我们确定这个值是字符串
                    }

                    return (
                        <CarouselItem key={index}>
                            <Image className={imageClass} src={imageSrc}/>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <CarouselPrevious/>
            <CarouselNext/>
        </Carousel>
    )
}
