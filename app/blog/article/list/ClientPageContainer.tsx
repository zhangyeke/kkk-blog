"use client"
import {env} from "env.mjs"
import {getPostsByPage} from "@/service/post"
import {Image, InfiniteScrollList} from "@/components/k-view"
import Article from "@/app/blog/components/Article";
import ScrollElement from "@/components/scroll-animation";
import {useCallback, useMemo, useState} from "react";
import {PostCategory} from "@/types/postCategory"
import Tabs from "@/components/Tabs";


export type PageContainerProps = {
    categoryList: PostCategory[]
    defaultParams?: {
        cid: string;
        tags: string;
        title: string
    }
}


export default function ClientPageContainer({categoryList, defaultParams}: PageContainerProps) {

    const [cate, setCate] = useState(parseInt(defaultParams?.cid || '0'))
    const defaultSearchParams = {
        keyword: defaultParams?.tags ? defaultParams?.tags : (defaultParams?.title ?? ''),
        type: defaultParams?.tags ? 'tags' : "title"
    }

    const [searchParams, setSearchParams] = useState(defaultSearchParams)


    const cateList = useMemo(() => {
        return [{id: 0, name: "全部"}, ...categoryList]
    }, [categoryList])

    const defaultActiveIndex = useMemo(() => {
        return cateList.findIndex(item => item.id === cate)
    }, [cate, cateList])

    const apiParams = useMemo(() => {
        const where = {
            [searchParams.type]: {
                contains: searchParams.keyword,
                mode: 'insensitive'
            }

        } as AnyObject
        if (cate) {
            where.categoryId = Number(cate)
        }

        return {
            orderBy: {createdAt: 'desc'},
            where
        }
    }, [cate, searchParams.keyword, searchParams.type])


    const handleSearch = useCallback((p: typeof searchParams) => {
        setSearchParams(p)
    }, [setSearchParams])
    return (
        <div>
            {/*<img src={'https://api.seaya.link/web?type=file'} className={'w-full object-cover'}/>*/}
            <div className={'relative h-[250px] flex-center'}>
                <Image className={'size-full absolute inset-0'} src={env.NEXT_PUBLIC_RANDOM_IMAGE_URL_2}/>
                <Article.SearchBar
                    defaultValue={searchParams}
                    className={'w-1/4  relative bg-card/80 shadow-md'}
                    onSearch={handleSearch}
                />

            </div>
            <div className={'px-4 lg:w-[800px] mx-auto  pb-4'}>
                <Tabs
                    className={'my-4'}
                    items={cateList}
                    defaultActiveIndex={defaultActiveIndex}
                    onClick={(item) => setCate(item.id)}
                />

                <Article.HeadCategory name={'发现'} isMore={false} icon={'yezi'}/>
                <InfiniteScrollList
                    apiParams={apiParams}
                    fetchData={getPostsByPage}
                    renderItem={(item, i) => (
                        <ScrollElement
                            className={'mb-4'}
                            key={item.id}
                            viewport={{
                                once: true,
                                amount: 0.5,
                                margin: '0px 0px 0px 0px'
                            }}
                            direction={i % 2 === 0 ? 'left' : 'right'}
                        >
                            <Article.Horizontal
                                cateClicked={false}
                                data={item}
                                direction={i % 2 === 0 ? 'left' : 'right'}
                            />
                        </ScrollElement>
                    )}
                />

            </div>
        </div>
    )
}
