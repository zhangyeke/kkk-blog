import {getPostCategoryWithPosts} from "@/service/postCategory";
import {getPostsByPage} from "@/service/post";
import Article from "@/app/blog/components/Article";
import {Empty} from "@/components/k-view";

export default async function HomeArticleList() {
    const postCategory = await getPostCategoryWithPosts();
    const posts = await getPostsByPage({
        page: 1,
        pageSize: 6,
        orderBy: {createdAt: 'desc'}
    })


    return (
        <>
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
        </>
    )
}
