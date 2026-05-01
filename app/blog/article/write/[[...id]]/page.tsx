/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-10-22 15:38:36
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 02:08:25
 * @FilePath: \blog\app\blog\article\write\[[...id]]\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react"
import {ArticleForm} from "../components/ArticleForm";
import "@/styles/cube-bg.css";
import { PostWithFavorites } from "@/types/post";
import { getPostById } from "@/service/post";

export const metadata = {
    title: "编写文章"
};

export default async function Page({params}: PageParams<{ id: string }>) {
    const routeParams = await params
    const id = parseInt(routeParams.id?.[0] || '') || undefined
    let post: PostWithFavorites | null = null
    if(id){
        const res  = await getPostById(id)
        post = res.data
    }

    return (
        <div className={'header-padding  py-10 cube-bg dark:bg-red-500'}>
            <div className={'container  bg-background p-5 rounded-lg shadow-lg '}>
                <ArticleForm postId={id} defaultValue={post}/>
            </div>
        </div>
    )
}
