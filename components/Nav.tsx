"use client"
import {useParams, useSearchParams, useSelectedLayoutSegment, useSelectedLayoutSegments} from "next/navigation"
import qs from "qs"
import React, {useEffect} from "react"

export default function Nav() {
    const segment = useSelectedLayoutSegment();
    const segments = useSelectedLayoutSegments();

    useEffect(() => {
        const params = {
            key: "43302062-211153aa0904393a2dd92a4b2",
            orientation: "horizontal",
            min_width: 1920,
            min_height: 1080,
            editors_choice: true,
            per_page: '3',
        }

        const urlParams = qs.stringify(params)
        console.log(urlParams, "lkjkl ")
        fetch(`https://pixabay.com/api/?${urlParams}`).then(async (res) => {
            console.log("有东西吗", await res.json())
        })
    }, [])


    return (
        <div>
            <div>当前路由段:{segment}</div>
            <div>所有路由段:{segments.join("/")}</div>
        </div>
    )
}
