"use client"
import React from "react"
import {useParams,useSearchParams,useSelectedLayoutSegment,useSelectedLayoutSegments} from "next/navigation"

export default function Page() {
    const segment = useSelectedLayoutSegment();
    const segments = useSelectedLayoutSegments();

    return (
        <div>
            <div>当前路由段:{segment}</div>
            <div>所有路由段:{segments.join("/")}</div>
        </div>
    )
}
