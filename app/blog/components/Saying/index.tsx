/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-03 18:23:14
 * @FilePath: \blog\app\blog\components\Saying\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React, {useCallback} from "react";
import {Smoky} from "@/components/k-view"
import {getSaying} from "@/service/alApi";

// 随机名言组件
export default function Saying({className, style}: BaseComponentProps) {
    const [content, setContent] = React.useState("")

    const getData = React.useCallback(async () => {
        const {data} = await getSaying()

        if (data && data.hitokoto) {
            const {hitokoto, from_who} = data
            setContent(`${hitokoto} --${from_who || '佚名'}`)
        }
    }, [])

    const handleSmokyEnd = useCallback(() => {
        setContent('')
        getData();
    }, [getData, setContent])

    React.useEffect(() => {
        getData()
    }, [])

    if (!content) return null

    return (
        <Smoky
            className={`${className}`}
            style={style}
            delay={10}
            content={content}
            color={'#FFC833'}
            onSmokyEnd={handleSmokyEnd}
        />
    )
}
