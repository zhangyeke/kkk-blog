"use client"
import * as React from "react"
import {Avatar, AvatarFallback, AvatarImage} from "../ui/avatar";

export interface ImageProps extends React.ComponentProps<typeof AvatarImage> {
    fallback?: Slots<'fallback'> | string;
}

export default function Image(props: ImageProps) {
    const {fallback,className, ...imageProps} = props;
    return (
        <Avatar className={className}>
            <AvatarImage {...imageProps} className={'object-cover'}/>
            <AvatarFallback>
                {fallback ? fallback : <AvatarImage src={'/images/empty/image_error.png'} alt={"加载失败"}/>}
            </AvatarFallback>
        </Avatar>
    )
}
