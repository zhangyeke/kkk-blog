"use client"
import React from "react"

export default function ArticleList(props: { api: Promise<any> }) {
    const list = React.use(props.api)
    console.log(list, "???")

    return (
        <div>

        </div>
    )
}
