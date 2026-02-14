"use client"
import React from "react"
import {GoButton, showDialog} from "@/components/k-view";
import {ArticleForm} from "@/components/ArticleForm";

export default function WriteArticleButton() {

    function handleClick() {

        showDialog({
            title: "写文章",
            contentClassName: "w-[1000px]",
            footer: null,
            children: (
                <ArticleForm/>
            )
        })
    }


    return <GoButton className={'mt-4'} onClick={handleClick}/>
}
