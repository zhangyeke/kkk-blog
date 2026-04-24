"use client"
import React, {useCallback, useMemo, useRef, useState} from "react"
import {PostCategory} from "@/types/postCategory";
import Tabs from "@/components/Tabs";
import {InfiniteScrollList, InfiniteScrollListInstance} from "@/components/k-view";
import ScrollElement from "@/components/scroll-animation";
import Article from "@/app/blog/components/Article";
import {getMeFavorites, updatePostFavorite} from "@/service/postFavorite";
import {FavoriteWithPostWithFavorites} from "@/types/postFavorite"
import {produce} from "immer";
import {toast} from "sonner";

export type ClientPageContainerProps = {
    categoryList: PostCategory[]

}


export default function ClientPageContainer({categoryList}: ClientPageContainerProps) {
    const listInstance = useRef<InfiniteScrollListInstance<FavoriteWithPostWithFavorites>>(null)
    const [cate, setCate] = useState<number>()

    const cateList = useMemo(() => {
        return [{id: 0, name: "全部"}, ...categoryList]
    }, [categoryList])

    const apiParams = useMemo(() => {

        return {
            post: {
                categoryId: cate ? cate : undefined
            },
        }
    }, [cate])

    const handleCollectChange = useCallback(async (item: FavoriteWithPostWithFavorites, i: number) => {
        await updatePostFavorite(item.post.id).then(({data: isLiked, message}) => {
            toast.success(message)
            listInstance.current?.updateItems(produce(draft => {
                if (draft[i]) {
                    draft[i].post.favorites.length = isLiked ? 1 : 0
                }
            }))
        })

        console.log(item.post, item.user, listInstance.current)
    }, [])


    return (
        <div className={'container min-h-[300px] header-padding'}>
            <Tabs
                className={'my-4'}
                items={cateList}
                onClick={(item) => setCate(item.id)}
            />

            <InfiniteScrollList
                ref={listInstance}
                className={'columns-3 w-full'}
                apiParams={apiParams}
                fetchData={getMeFavorites}
                renderItem={(item, i) => (
                    <ScrollElement
                        className={'mb-4'}
                        key={item.post.id}
                        viewport={{
                            once: true,
                            amount: 0.5,
                            margin: '0px 0px 0px 0px'
                        }}
                    >
                        <Article.Vertical
                            showCollect={true}
                            data={item.post}
                            onCollectChange={() => handleCollectChange(item, i)}
                        />
                    </ScrollElement>
                )}
            />
        </div>
    )
}
