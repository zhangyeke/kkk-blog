"use client"
import React from "react";
import {useTheme} from "next-themes";
import {Smoky} from "@/components/k-view"
import {getSaying} from "@/service/alApi";
import {useAppStore} from "@/hooks";

// 随机名言组件
export default function Saying({className, style}: BaseComponentProps) {
    const [content, setContent] = React.useState("")
    const {theme} = useTheme()
    const {themes} = useAppStore(state => state)
    const getData = async () => {
        const res = await getSaying()
        if (res && res.hitokoto) {
            const {hitokoto, from_who} = res
            setContent(`${hitokoto} --${from_who || '佚名'}`)
        }
    }

    React.useEffect(() => {
        getData()
    }, [])


    return (
        <Smoky className={`${className}`} style={style} delay={20} content={content}
               color={theme === 'light' ? '#fff' : themes.primary}
               onSmokyEnd={getData}/>
    )
}
