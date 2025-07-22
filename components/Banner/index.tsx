"use client"
import * as React from "react"
import Image from "../Image"
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay";

export interface BannerProps<T> extends React.ComponentProps<typeof Carousel> {
    list: T[] | string[];
    imageKey?: keyof T
    imageClass?: string
    autoplay?: boolean;
    delay?: number;
}

export default function Banner<T>(props: BannerProps<T>) {
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
                {list.map((item, index) => (
                    <CarouselItem key={index}>
                        <Image className={imageClass}
                               src={typeof item === 'string' ? item : item[imageKey]}/>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious/>
            <CarouselNext/>
        </Carousel>
    )
}
