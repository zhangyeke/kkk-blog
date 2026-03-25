"use client"
import React from "react"
import {GoButton} from "@/components/k-view";

export default function WriteArticleButton() {

    // function handleClick() {
    //
    //     showDialog({
    //         title: "写文章",
    //         contentClassName: "w-[1000px]",
    //         footer: null,
    //         children: (
    //             <ArticleForm/>
    //         )
    //     })
    // }


    return <GoButton className={'mt-4'} href={"/blog/article/write"}/>
}
