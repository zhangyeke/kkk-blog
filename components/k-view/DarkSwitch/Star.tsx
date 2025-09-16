"use client"
import React from "react"
import {cn} from "@/lib/utils";
import styles from "./darkSwitch.module.css"

export type StarProps = {
    zoom: number
    color?: string
} & BaseComponentProps


export function Star(props: StarProps) {
    const {zoom, color = 'white', className = '', style} = props;
    const starStyle: { "--color": string; "--zoom": number } & React.CSSProperties = {
        ...style,
        "--zoom": zoom,
        "--color": color,
    }

    return (
        <div style={starStyle} className={cn(`relative bg-[var(--color)] scale-[var(--zoom)]`,className)}>
            <div className={styles['star-vertical']}></div>
            <div className={styles['star-horizontal']}></div>
        </div>
    )
}
