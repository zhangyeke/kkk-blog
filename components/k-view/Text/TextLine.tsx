"use client";
import React from 'react';
import {addUnit, cn} from "@/lib/utils";

export interface TextLineProps extends BaseComponentProps, ContainerProps {
    lineHeight?: number | string;
    lineColor?: string;
    position?: string; // 线条离开位置，默认为右下角
    enterPosition?: string; // 鼠标悬停进入的线条位置，默认为左下角
    isHover?: boolean | number;
    duration?: number;
    curve?: string;
    onClick?: (e?: React.MouseEvent<HTMLSpanElement>) => void
}


export const TextLine = (props: TextLineProps) => {

    const {
        style,
        className,
        children,
        lineColor = "#91EAE4, #86A8E7, #7F7FD5",
        lineHeight = '2px',
        isHover = true,
        position = 'right bottom',
        enterPosition = 'left bottom',
        duration = 800,
        curve = "linear",
        onClick
    } = props;
    // 是否是渐变颜色
    const isMoreColor = lineColor.split(',');
    const color = isMoreColor.length > 1 ? lineColor : `${lineColor},${lineColor}`

    const textStyle = {
        '--line-height': addUnit(lineHeight),
        '--line-color': color,
        '--enter-position': enterPosition,
        'backgroundImage': 'linear-gradient(to right, var(--line-color))', /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
        'backgroundSize': `${isHover ? 0 : '100%'} var(--line-height)`,
        'backgroundPosition': position,
        'transition': `background-size ${duration}ms ${curve}`,
        ...style
    }


    return (
        <span
            style={textStyle}
            className={cn(isHover && 'hover:!bg-[position:var(--enter-position)] hover:!bg-[length:100%_var(--line-height)]', 'relative bg-no-repeat', className)}
            onClick={onClick}
        >
            {children}
        </span>
    );
};

