"use client"
import React from "react"
import {useWindowSize} from "react-use"
import {noop, times} from "lodash"
import {Wavy} from "./Wavy";

export interface WavyGroupProps extends BaseComponentProps {
    waveColor?: string;
    waveNumber?: number
}

export function WavyGroup(props: WavyGroupProps) {
    const {width: winWidth} = useWindowSize()
    const {style, className, waveColor = '#fff', waveNumber = 2} = props
    const emptyArray = times(waveNumber, noop)

    return (
        <div style={style} className={`relative ${className}`}>
            {
                emptyArray.map((_, index) => (
                    <div className={"absolute bottom-0 left-0"}>
                        <Wavy width={winWidth} waveSpeed={index + 1} direction={index % 2 === 0 ? 'rtl' : 'ltr'}
                              key={index}/>
                    </div>
                ))
            }
        </div>
    )
}
