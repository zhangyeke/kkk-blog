import {Metadata} from "next"
import {Suspense} from "@/components/k-view";
import {GLOBAL_TITLE} from "@/config/blog"
import Master from "./components/Master";
import TodayPoetry from "./components/TodayPoetry";
import HomeHedaer from "./components/HomeHeader";
import HomeArticleList from "./components/HomeArticleList";
import Article from "./components/Article"
import ScrollElement from "@/components/scroll-animation";

export const metadata: Metadata = {
    title: GLOBAL_TITLE
}


const scrollElementProps = {
    viewport: {once: true, amount: 0.5, margin: '0px 0px 0px 0px'},
    direction: 'left' as const
}

export default async function Web() {


    return (
        <div>
            <HomeHedaer/>

            <div className={'container flex py-4'}>
                <aside className={'w-1/3'}>
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

                    {/*推荐文章*/}
                    <Suspense className={'w-full h-[300px]'}>
                        <ScrollElement {...scrollElementProps}>
                            <Article.HotArticles className={'mt-4'}/>
                        </ScrollElement>
                    </Suspense>
                </aside>
                <section className={'ml-10 flex-1'}>
                    <Suspense className={'w-full min-h-[600px]'}>
                        <HomeArticleList/>
                    </Suspense>
                </section>

            </div>

        </div>
    )
}
