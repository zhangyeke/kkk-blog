"use client"
import React from "react"
import {Avatar, AvatarFallback, AvatarImage} from "../../ui/avatar";

export interface ImageProps extends React.ComponentProps<typeof AvatarImage> {
    fallback?: React.ReactNode;
}

export  function Image(props: ImageProps) {
    const {fallback, className, ...imageProps} = props;
    return (
        <Avatar className={className}>
            <AvatarImage {...imageProps} className={'object-cover'}/>
            <AvatarFallback >
                {fallback ? fallback : <AvatarImage src={'/images/placeholder/image_error.png'} alt={"加载失败"}/>}
            </AvatarFallback>
        </Avatar>
    )
}
