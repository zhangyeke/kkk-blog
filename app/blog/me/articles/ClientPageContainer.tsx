"use client"
import React, {useMemo, useState} from "react"
import Tabs from "@/components/Tabs";
import {InfiniteScrollList} from "@/components/k-view";
import ScrollElement from "@/components/scroll-animation";
import Article from "@/app/blog/components/Article";
import {PostCategory} from "@/types/postCategory";
import {PostWithUser} from "@/types/post";
import {getMePosts} from "@/service/post";

export type ClientPageContainerProps = {
    categoryList: PostCategory[]
}

export default function ClientPageContainer({categoryList}: ClientPageContainerProps) {
    const [cate, setCate] = useState<number>()

    const cateList = useMemo(() => {
        return [{id: 0, name: "全部"}, ...categoryList]
    }, [categoryList])

    const apiParams = useMemo(() => {
        return {
            categoryId: cate ? cate : undefined
        }
    }, [cate])

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
                        <Article.Vertical data={item}/>
                    </ScrollElement>
                )}
            />
        </div>
    )
}
