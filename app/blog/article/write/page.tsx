"use client"
import React from "react"
import {ArticleForm} from "@/components/ArticleForm";

export default function Page() {
    return (
        <div className={'py-10 bg-[url(/images/editor_article_bg.jpeg)] bg-cover bg-center'}>
            <div className={'container  bg-background p-5 rounded-lg shadow-lg '}>
                <ArticleForm/>
            </div>
        </div>
    )
}
