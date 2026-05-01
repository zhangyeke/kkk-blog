/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-24 15:45:24
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 01:46:51
 * @FilePath: \blog\app\blog\me\articles\ClientPageContainer.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React, { useCallback, useMemo, useState } from "react"
import Tabs from "@/components/Tabs";
import { InfiniteScrollList } from "@/components/k-view";
import ScrollElement from "@/components/scroll-animation";
import Article from "@/app/blog/components/Article";
import { PostCategory } from "@/types/postCategory";
import { PostWithUser } from "@/types/post";
import { getMePosts } from "@/service/post";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import { useRouter } from "next/navigation";

export type ClientPageContainerProps = {
    categoryList: PostCategory[]
}

export default function ClientPageContainer({ categoryList }: ClientPageContainerProps) {
    const [cate, setCate] = useState<number>()
    const router = useRouter()

    const cateList = useMemo(() => {
        return [{ id: 0, name: "全部" }, ...categoryList]
    }, [categoryList])

    const apiParams = useMemo(() => {
        return {
            categoryId: cate ? cate : undefined
        }
    }, [cate])

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, id: number) => {
        e.stopPropagation()
        e.preventDefault()
        router.push(`/blog//article/write/${id}`)
    }, [])

    return (
        <div className={'container min-h-[300px] header-padding'}>
            <Tabs
                className={'mt-4 mb-6'}
                items={cateList}
                onClick={(item) => setCate(item.id)}
            />

            <InfiniteScrollList
                className={'columns-3 w-full'}
                apiParams={apiParams}
                fetchData={getMePosts}
                renderItem={(item: PostWithUser, i) => (
                    <ScrollElement
                        className={'mb-4'}
                        key={item.id}
                        viewport={{
                            once: true,
                            amount: 0.5,
                            margin: '0px 0px 0px 0px'
                        }}
                    >
                        <Article.Vertical data={item}>
                            <Button
                                size='sm'
                                className="absolute top-2 right-2 z-10 group-hover:opacity-100 opacity-0 transition-opacity duration-300"
                                onClick={(e) => handleClick(e, item.id)}
                            >
                                <SquarePen className="size-5" />
                            </Button>
                        </Article.Vertical>
                    </ScrollElement>
                )}
            />
        </div>
    )
}
