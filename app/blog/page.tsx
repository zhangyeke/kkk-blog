/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 23:01:02
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-02 00:38:40
 * @FilePath: \blog\app\blog\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Suspense } from "@/components/k-view/Loader";
import type { Metadata } from "next"
import { createPublicPageMetadata } from "@/lib/seo/metadata"
import Master from "./components/Master";
import TodayPoetry from "./components/TodayPoetry";
import HomeHedaer from "./components/HomeHeader";
import HomeArticleList from "./components/HomeArticleList";
import Article from "./components/Article"
import ScrollElement from "@/components/scroll-animation";
import { BLOG_PAGE_KEYS, requireBlogPageAccess } from "@/lib/blog/permissions"

export const metadata: Metadata = createPublicPageMetadata({
    title: "首页",
    description: "记录技术实践、生活见闻与旅行足迹，浏览最新文章和精选内容。",
    path: "/blog",
})

const scrollElementProps = {
    viewport: { once: true, amount: 0.5, margin: '0px 0px 0px 0px' },
    direction: 'left' as const
}

export default async function Web() {
    const access = await requireBlogPageAccess(BLOG_PAGE_KEYS.home)
    const allowedCategoryIds = [...access.categoryIds]
    const canSearchArticles = access.keys.has(BLOG_PAGE_KEYS.articleList)
    return (
        <div>
            <HomeHedaer />

            <div className={'container flex py-4'}>
                <aside className={'w-1/4 lg:block hidden'}>
                    {canSearchArticles && (
                        <ScrollElement {...scrollElementProps}>
                            <Article.SearchBar className={'bg-card mb-4'} />
                        </ScrollElement>
                    )}

                    {/*作者信息组件*/}
                    <Suspense className={'w-full h-[330px]'}>
                        <ScrollElement {...scrollElementProps}>
                            <Master />
                        </ScrollElement>
                    </Suspense>

                    {/*博客首页今日诗词展示组件*/}
                    <Suspense className={'w-full h-[200px]'}>
                        <ScrollElement {...scrollElementProps}>
                            <TodayPoetry className={'mt-4'} />
                        </ScrollElement>
                    </Suspense>

                    {/*推荐文章*/}
                    <Suspense className={'w-full h-[300px]'}>
                        <ScrollElement {...scrollElementProps}>
                        <Article.HotArticles className={'mt-4'} categoryIds={allowedCategoryIds} />
                        </ScrollElement>
                    </Suspense>
                </aside>
                <section className={'lg:ml-10 flex-1'}>
                    <Suspense className={'w-full min-h-[600px]'}>
                        <HomeArticleList categoryIds={allowedCategoryIds} canSearch={canSearchArticles} />
                    </Suspense>
                </section>

            </div>

        </div>
    )
}
