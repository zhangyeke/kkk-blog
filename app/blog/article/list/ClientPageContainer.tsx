"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { env } from "env.mjs"

import { Image } from "@/components/k-view/Image"
import { Empty } from "@/components/k-view/Empty"
import Article from "@/app/blog/components/Article"
import type { PostCategory } from "@/types/postCategory"
import type { PostListItem } from "@/types/post"
import type { SearchBarProps } from "@/app/blog/components/Article/SearchBar"
import { articleListPath } from "@/lib/seo/site"

type SearchValues = { title: string; tags: string }

type ClientPageContainerProps = {
  categories: PostCategory[]
  posts: PostListItem[]
  page: number
  totalPages: number
  categoryId?: number
  search: SearchValues
}

export default function ClientPageContainer({
  categories,
  posts,
  page,
  totalPages,
  categoryId,
  search,
}: ClientPageContainerProps) {
  const router = useRouter()
  const keyword = search.title || search.tags
  const searchType = search.title ? "title" : "tags"

  const handleSearch = useCallback<NonNullable<SearchBarProps["onSearch"]>>(
    ({ keyword: value, type }) => {
      const params = new URLSearchParams()
      if (categoryId) params.set("cid", String(categoryId))
      if (value.trim()) params.set(type === "tags" ? "tags" : "title", value.trim())
      const query = params.toString()
      router.push(query ? `/blog/article/list?${query}` : "/blog/article/list")
    },
    [categoryId, router]
  )

  const pageHref = (targetPage: number) => {
    const query = new URLSearchParams()
    if (categoryId) query.set("cid", String(categoryId))
    if (search.title) query.set("title", search.title)
    if (search.tags) query.set("tags", search.tags)
    if (targetPage > 1) query.set("page", String(targetPage))
    const value = query.toString()
    return value ? `/blog/article/list?${value}` : articleListPath()
  }

  const searchTypeList = [
    { label: "标题", value: "title" },
    { label: "标签", value: "tags" },
  ]

  return (
    <div>
      <div className="relative flex h-[250px] items-center justify-center">
        <Image className="absolute inset-0 size-full" src={env.NEXT_PUBLIC_RANDOM_IMAGE_URL_2} alt="" />
        <Article.SearchBar
          defaultValue={{ keyword, type: searchType }}
          searchTypeList={searchTypeList}
          className="relative w-4/5 bg-card/80 shadow-md lg:w-1/3"
          onSearch={handleSearch}
        />
      </div>

      <div className="mx-auto w-full max-w-[800px] px-4 pb-6">
        <nav aria-label="文章分类" className="my-4 flex gap-2 overflow-x-auto pb-2">
          <Link
            href={articleListPath()}
            aria-current={!categoryId ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${!categoryId ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            全部
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={articleListPath({ categoryId: category.id })}
              aria-current={category.id === categoryId ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${category.id === categoryId ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <Article.HeadCategory name={categoryId ? categories.find((item) => item.id === categoryId)?.name ?? "文章" : "发现"} isMore={false} icon="yezi" />
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <Article.Horizontal key={post.id} data={post} direction={index % 2 === 0 ? "left" : "right"} />
            ))}
          </div>
        ) : (
          <Empty />
        )}

        {totalPages > 1 && (
          <nav aria-label="文章分页" className="mt-6 flex items-center justify-center gap-3 text-sm">
            {page > 1 ? (
              <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={pageHref(page - 1)} rel="prev">
                上一页
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-2 text-muted-foreground" aria-disabled="true">上一页</span>
            )}
            <span aria-current="page">第 {page} / {totalPages} 页</span>
            {page < totalPages ? (
              <Link className="rounded-md border px-3 py-2 hover:bg-muted" href={pageHref(page + 1)} rel="next">
                下一页
              </Link>
            ) : (
              <span className="rounded-md border px-3 py-2 text-muted-foreground" aria-disabled="true">下一页</span>
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
