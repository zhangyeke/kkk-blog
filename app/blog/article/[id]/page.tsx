/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 15:19:26
 * @FilePath: \blog\app\blog\article\[id]\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {notFound} from "next/navigation";
import {cache} from "react";
import NextImage from "next/image";
import type {Metadata} from "next";
import {getPostById} from "@/service/post";
import { MarkdownContent } from "@/components/k-view/MarkdownContent";
import { CopyText } from "@/components/k-view/Text";
import { Image } from "@/components/k-view/Image";
import {CategoryTag, Tag} from "@/app/blog/components/Article/Tag";
import {CalendarRange, Mail} from "lucide-react";
import {dateFormat} from "@/lib/date";
import {Separator} from "@/components/ui/separator";
import Article from "@/app/blog/components/Article";
import {auth} from "@/lib/auth";
import {getBlogBranding} from "@/lib/admin/settings-store";
import {getPlainText} from "@/lib/markdown";
import {absoluteSiteUrl, articlePath} from "@/lib/seo/site";
import { requireBlogCategoryAccess } from "@/lib/blog/permissions";

const getArticleById = cache((id: number) => getPostById(id))

const createArticleDescription = cache(async (content: string, title: string, category: string) => {
    const description = await getPlainText(content, 180)
    return description.replace(/\s+/g, " ").trim() || `${title}，发表于${category}分类。`
})

function getAbsoluteImageUrl(image: string | null | undefined, fallback: string) {
    const value = image?.trim()
    if (!value) return fallback
    try {
        const url = new URL(value, absoluteSiteUrl("/"))
        return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : fallback
    } catch {
        return fallback
    }
}

export async function generateMetadata({params}: PageParams<{ id: number }>): Promise<Metadata> {
    const {id} = await params
    const {data: post} = await getArticleById(Number(id))
    if (!post) {
        return notFound()
    }
    await requireBlogCategoryAccess(post.categoryId)

    const blog = await getBlogBranding()
    const canonical = absoluteSiteUrl(articlePath(post.id))
    const image = getAbsoluteImageUrl(post.cover, absoluteSiteUrl(blog.logo || "/images/logo_transparent.png"))
    const description = await createArticleDescription(post.content || "", post.title, post.category.name || "博客")
    const tags = post.tags?.split(",").map((tag: string) => tag.trim()).filter(Boolean) ?? []

    return {
        title: post.title,
        description,
        alternates: {canonical},
        openGraph: {
            type: "article",
            siteName: blog.name,
            title: post.title,
            description,
            url: canonical,
            images: [{url: image, alt: post.title}],
            publishedTime: post.createdAt?.toISOString(),
            authors: [post.user.name],
            tags,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description,
            images: [image],
        },
        ...(post.status !== 1 ? {robots: {index: false, follow: false}} : {}),
    }
}

export default async function Page({params}: PageParams<{ id: number }>) {
    const {id} = await params
    const session = await auth();
    const {data: post} = await getArticleById(Number(id))
    const tags = post?.tags?.split(',') || []
    if (!post) return notFound()
    await requireBlogCategoryAccess(post.categoryId)

    const blog = await getBlogBranding()
    const description = await createArticleDescription(post.content || "", post.title, post.category.name || "博客")
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image: getAbsoluteImageUrl(post.cover, absoluteSiteUrl(blog.logo || "/images/logo_transparent.png")),
        author: {"@type": "Person", name: post.user.name},
        publisher: {
            "@type": "Organization",
            name: blog.name,
            logo: {"@type": "ImageObject", url: getAbsoluteImageUrl(blog.logo, absoluteSiteUrl("/images/logo_transparent.png"))},
        },
        datePublished: post.createdAt?.toISOString(),
        mainEntityOfPage: absoluteSiteUrl(articlePath(post.id)),
        articleSection: post.category.name,
        keywords: tags,
    }
    const safeArticleSchema = JSON.stringify(articleSchema).replace(/</g, "\\u003c")

    return (
        <div>
            <script type="application/ld+json" dangerouslySetInnerHTML={{__html: safeArticleSchema}} />
            <div className={'relative h-[250px] flex flex-col pb-4'}>
                <Image src={post.cover} alt="" className={'size-full absolute inset-0 filter blur-xs'}/>
                <div className={'mt-auto relative z-10 w-3/4 mx-auto text-primary'}>
                    <h1 className={' text-xl font-bold'}>{post.title}</h1>
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

                            <NextImage src="/images/hot.png" width={20} height={20} className="mr-1 size-5" alt="热度" />
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
                <MarkdownContent markdown={post.content || ""}/>
            </div>
        </div>
    )
}
