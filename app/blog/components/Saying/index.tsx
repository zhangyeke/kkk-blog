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
