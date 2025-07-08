"use client"
import React from "react"
import http from "@/lib/http";
import {env} from "@/env.mjs"

console.log(env,"???")
export default  function ArticleList() {

    const result = React.use(http.get('/shopapi/article/lists'))
    console.log(result,"???")
    return (
        <div>
            {

            }
        </div>
    )
}
