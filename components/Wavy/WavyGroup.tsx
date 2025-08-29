// WavyGroup.tsx
"use client"
import React, {useEffect, useState} from "react" // 导入 useState 和 useEffect
import {useWindowSize} from "react-use"
import {noop, times} from "lodash"
import {Wavy} from "./Wavy";

export interface WavyGroupProps extends BaseComponentProps {
    waveColor?: string;
    waveNumber?: number
}

export function WavyGroup(props: WavyGroupProps) {
    // 1. 创建一个 state 来追踪组件是否已在客户端挂载
    const [isClient, setIsClient] = useState(false);

    // 2. 在 useEffect 中，将 state 更新为 true。
    //    这个 Hook 只会在组件在客户端成功挂载后运行一次。
    useEffect(() => {
        setIsClient(true);
    }, []);

    const {style, className, waveColor = '#fff', waveNumber = 2} = props;

    // 只有在 isClient 为 true 时，才调用 useWindowSize
    const {width: winWidth} = useWindowSize();
    const emptyArray = times(waveNumber, noop);

    // 3. 关键：在 isClient 为 false 时，返回 null 或一个占位符
    //    这确保了服务端和客户端的首次渲染结果一致（都是 null）
    if (!isClient) {
        return null;
    }

    return (
        <div style={style} className={`relative ${className}`}>
            {
                emptyArray.map((_, index) => (
                    <div className={"absolute bottom-0 left-0"} key={index}>
                        <Wavy
                            width={winWidth} // 此时 winWidth 已经是客户端的真实宽度
                            waveSpeed={index + 1}
                            direction={index % 2 === 0 ? 'rtl' : 'ltr'}
                        />
                    </div>
                ))
            }
        </div>
    )
}