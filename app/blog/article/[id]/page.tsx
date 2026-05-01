/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 15:19:26
 * @FilePath: \blog\app\blog\article\[id]\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {getPostById} from "@/service/post";
import {AsyncMarkedEditor, CopyText, Image} from "@/components/k-view";
import {CategoryTag, Tag} from "@/app/blog/components/Article/Tag";
import {CalendarRange, Mail} from "lucide-react";
import {dateFormat} from "@/lib/date";
import {Separator} from "@/components/ui/separator";
import Article from "@/app/blog/components/Article";
import {auth} from "@/lib/auth";

export async function generateMetadata({params}: PageParams<{ id: number }>): Promise<Metadata> {
    const {id} = await params
    const {data: post} = await getPostById(Number(id))
    if (!post) {
        return notFound()
    }
    return {title: post.title}
}

export default async function Page({params}: PageParams<{ id: number }>) {
    const {id} = await params
    const session = await auth();
    const {data: post} = await getPostById(Number(id))
    const tags = post?.tags?.split(',') || []
    if (!post) return notFound()

    return (
        <div>
            <div className={'relative h-[250px] flex flex-col pb-4'}>
                <Image src={post.cover} className={'size-full absolute inset-0 filter blur-xs'}/>
                <div className={'mt-auto relative z-10 w-3/4 mx-auto text-primary'}>
                    <h2 className={' text-xl font-bold'}>{post.title}</h2>
                    <div className={'flex items-end mt-2'}>
                        <div className={'flex-1 flex items-center text-sm'}>
                            <Image
                                src={post.user.avatar || ''}
                                className={'object-cover size-10 mr-1 rounded-full'}
                                fallback={post.user.name.substring(0, 1)}
                            />
                            <span>{post.user.name}</span>

                            <Separator orientation="vertical" className={'mx-4 !h-4'}/>

                            <CalendarRange className={'size-4 mr-1 '}/>
                            <span>{dateFormat(post.createdAt || 0, 'YYYY年MM月DD日')}</span>

                            <Separator orientation="vertical" className={'mx-4 !h-4'}/>

                            <img src={'/images/hot.png'} className={'size-5 '} alt={'热度'}/>
                            <span>{post.pv}</span>

                            <Separator orientation="vertical" className={'mx-4 !h-4'}/>

                            <CopyText className={'mr-4'} text={post.user.email}>
                                <Mail className={'size-4'}/>
                                <span>{post.user.email}</span>
                            </CopyText>

                            {
                                session &&
                                (
                                    <Article.CollectButton
                                        postId={post.id}
                                        initialCount={post.favoriteCount}
                                        defaultValue={post.isFavorite}
                                    />
                                )
                            }
                        </div>
                        <div className={'flex flex-wrap gap-2'}>
                            <CategoryTag
                                cid={post.categoryId}
                                name={post.category.name || ''}
                                className={'bg-yellow-100 hover:bg-yellow-300 transition-all cursor-pointer'}
                            />
                            {
                                tags.length > 0 && tags.map((name, i) => (
                                    <Tag
                                        key={i}
                                        name={name}
                                        className={'hover:bg-sky-200 transition-all cursor-pointer'}
                                    />
                                ))
                            }

                        </div>
                    </div>
                </div>
            </div>
            <div className={'container my-4'}>
                <AsyncMarkedEditor value={post.content} readOnly={true}/>
            </div>
        </div>
    )
}
