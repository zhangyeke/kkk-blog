"use client"
import React from "react";
import {Smoky} from "@/components/k-view"
import {getSaying} from "@/service/alApi";

export default function Saying({className, style, color}: { color?: string } & BaseComponentProps) {
    const [content, setContent] = React.useState("")

    const getData = async () => {
        const res = await getSaying()
        if (res.code === 200) {
            const {content,author} = res.data
            setContent(`${content} --${author}`)
        }
    }

    React.useEffect(() => {
        getData()
    }, [])


    return (
        <Smoky className={className} style={style} delay={20} content={content} color={color} onSmokyEnd={getData}/>
    )
}
