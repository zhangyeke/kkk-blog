import React from "react"
import {ArticleForm} from "./components/ArticleForm";
import "@/styles/cube-bg.css";

export default async function Page() {
    return (
        <div className={'header-padding  py-10 cube-bg dark:bg-red-500'}>
            <div className={'container  bg-background p-5 rounded-lg shadow-lg '}>
                <ArticleForm/>
            </div>
        </div>
    )
}
