"use client"
import {noop, times} from "lodash"
import React from "react"
import {useWindowSize} from "react-use"
import {hex2rgb} from "@/lib/color";
import {Wavy} from "./Wavy";

export interface WavyGroupProps extends BaseComponentProps {
    waveColor?: string;
    waveNumber?: number
}

export function WavyGroup(props: WavyGroupProps) {
    const {width: winWidth} = useWindowSize()
    const {style, className, waveColor = '#ffffff', waveNumber = 2} = props
    const emptyArray = times(waveNumber, noop)

    return (
        <div style={style} className={`relative ${className}`}>
            {
                emptyArray.map((_, index) => (
                    <div className={"absolute bottom-0 left-0"} key={index}>
                        <Wavy width={winWidth} waveSpeed={0.5 * (index + 1)}
                              waveColor={index ? hex2rgb(waveColor, Math.max(0, 1 - index * 0.4)) : waveColor}
                              key={index}/>
                    </div>
                ))
            }
        </div>
    )
}
