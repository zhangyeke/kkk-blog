"use client"
import {useWindowSize} from "react-use"
import {noop, times} from "lodash"
import React from "react" // 导入 useState 和 useEffect
import {Wavy} from "./Wavy";
import {useTheme} from "next-themes";
import {useAppStore, useClientMounted} from "@/hooks";
import {color2dark} from "@/lib/color";

export interface WavyGroupProps extends BaseComponentProps {
    waveColor?: string;
    waveNumber?: number
}

export function WavyGroup(props: WavyGroupProps) {

    const isMounted = useClientMounted()
    const {theme} = useTheme()
    const {themes} = useAppStore(state => state)

    const {style, className, waveColor = '#ffffff', waveNumber = 2} = props;

    const {width: winWidth} = useWindowSize();
    const emptyArray = times(waveNumber, noop);

    if (!isMounted) return null;

    return (
        <div style={style} className={`relative ${className}`}>
            {
                emptyArray.map((_, index) => (
                    <div className={"absolute bottom-0 left-0"} key={index}>
                        <Wavy
                            waveColor={theme === 'light' ? waveColor : color2dark(themes.primary, 0.05)}
                            width={winWidth}
                            waveSpeed={index + 1}
                            direction={index % 2 === 0 ? 'rtl' : 'ltr'}
                        />
                    </div>
                ))
            }
        </div>
    )
}