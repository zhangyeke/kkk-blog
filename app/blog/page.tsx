import {Metadata} from "next"
import {Empty, Suspense} from "@/components/k-view";
import {GLOBAL_TITLE} from "@/config/blog"
import Master from "./components/Master";
import TodayPoetry from "./components/TodayPoetry";
import HomeHedaer from "./components/HomeHeader";
import Article from "./components/Article"
import {getPostsByPage} from "@/service/post";
import {getPostCategoryWithPosts} from "@/service/postCategory";
import ScrollElement from "@/components/scroll-animation";
import {auth} from "@/lib/auth";

export const metadata: Metadata = {
    title: GLOBAL_TITLE
}


export default async function Web() {
    const session = await auth()
    console.log("还有东西吗", session)

    const postCategory = await getPostCategoryWithPosts();
    const posts = await getPostsByPage({
        page: 1,
        pageSize: 6,
        orderBy: {createdAt: 'desc'}
    })

    const scrollElementProps = {
        viewport: {once: true, amount: 0.5, margin: '0px 0px 0px 0px'},
        direction: 'left' as const
    }

    return (
        <div>

            <Suspense className={'w-full h-[500px]'}>
                <HomeHedaer/>
            </Suspense>


            <div className={'container flex py-4'}>
                <aside className={'w-[320px]'}>
                    <ScrollElement {...scrollElementProps}>
                        <Article.SearchBar className={'bg-card mb-4'}/>
                    </ScrollElement>

                    {/*作者信息组件*/}
                    <Suspense className={'w-full h-[330px]'}>
                        <ScrollElement {...scrollElementProps}>
                            <Master/>
                        </ScrollElement>
                    </Suspense>

                    {/*博客首页今日诗词展示组件*/}
                    <Suspense className={'w-full h-[200px]'}>
                        <ScrollElement {...scrollElementProps}>
                            <TodayPoetry className={'mt-4'}/>
                        </ScrollElement>
                    </Suspense>
                    <Suspense>
                        <ScrollElement {...scrollElementProps}>
                            <Article.HotArticles className={'mt-4'}/>
                        </ScrollElement>
                    </Suspense>
                </aside>
                <section className={'ml-10 flex-1'}>
                    <Article.HeadCategory name={'最新'}/>
                    {
                        posts.data.list.length > 0 ?
                            <Article.List
                                initialData={posts.data.list}
                                className={'flex flex-wrap gap-4'}
                                scrollProps={{
                                    className: 'w-[32%]'
                                }}
                            />
                            : <Empty/>

                    }

                    {
                        postCategory.data.length > 0 && (
                            postCategory.data.map(cate => (
                                <div className={'mt-4'} key={cate.id}>
                                    <Article.HeadCategory
                                        href={`/blog/article/list?cid=${cate.id}`}
                                        name={cate.name}
                                        isMore={cate.posts.length > 0}
                                    />
                                    {
                                        (cate.posts && cate.posts.length > 0) ?
                                            <Article.List
                                                initialData={cate.posts}
                                                className={'flex flex-wrap gap-4'}
                                                scrollProps={{
                                                    className: 'w-[32%]'
                                                }}
                                            />
                                            : <Empty/>
                                    }
                                </div>
                            ))
                        )
                    }
                </section>

            </div>

        </div>
    )
}
