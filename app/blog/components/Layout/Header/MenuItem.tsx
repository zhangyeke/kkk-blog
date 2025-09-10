"use client"
import React from "react"
import {cn} from "@/lib/utils";

export type MenuItemProps = {
    onClick: (e?: React.MouseEvent<HTMLDivElement>) => void
} & BaseComponentProps & ContainerProps

export function MenuItem({children, onClick, className, style}: MenuItemProps) {

    return (
        <div style={style} className={cn('text-nowrap cursor-pointer flex items-center gap-x-2', className)}
             onClick={onClick}>
            {children}
        </div>
    )
}
