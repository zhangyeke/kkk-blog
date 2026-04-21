import {cn} from "@/lib/utils";
import React from "react";

export type IconProps = {
    name: string
} & BaseComponentProps & React.HTMLAttributes<HTMLDivElement>

export function Icon({name, className, style, ...props}: IconProps) {
    return (
        <i style={style} className={cn(`iconfont icon-${name} text-base`, className)} {...props}></i>
    )
}