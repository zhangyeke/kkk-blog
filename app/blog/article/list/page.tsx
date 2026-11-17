import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import type { Prisma } from "@prisma/client"

import { getPostsByPage } from "@/service/post"
import { getPostCategoryList } from "@/service/postCategory"
import { absoluteSiteUrl, articleListPath } from "@/lib/seo/site"
import { createPublicPageMetadata } from "@/lib/seo/metadata"
import type { PostCategory } from "@/types/postCategory"
import type { PostListItem } from "@/types/post"
import ClientPageContainer from "./ClientPageContainer"
import { BLOG_PAGE_KEYS, getBlogAccess } from "@/lib/blog/permissions"

type SearchParams = {
  cid?: string | string[]
  title?: string | string[]
  tags?: string | string[]
  tag?: string | string[]
  page?: string | string[]
}

type PageProps = { searchParams: Promise<SearchParams> }

const getPublicCategories = cache(async (): Promise<PostCategory[]> => {
  const result = await getPostCategoryList()
  return result.code === 200 && Array.isArray(result.data) ? result.data : []
})

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function parsePositiveInt(value?: string | string[], fallback = 1) {
  const parsed = Number.parseInt(firstParam(value) ?? "", 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function categoryFromParams(params: SearchParams, categories: PostCategory[]) {
  const rawId = firstParam(params.cid)
  if (!rawId) return undefined
  const id = Number(rawId)
  if (!Number.isSafeInteger(id) || id <= 0) return undefined
  return categories.find((category) => category.id === id)
}

function getSearchTerm(params: SearchParams) {
  return (firstParam(params.title) || firstParam(params.tags) || firstParam(params.tag) || "").trim()
}

function createWhere(categoryId: number | undefined, title: string, tags: string, allowedCategoryIds: string): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = {}
  where.categoryId = categoryId ?? {in: allowedCategoryIds ? allowedCategoryIds.split(",").map(Number) : []}
  if (title) where.title = { contains: title, mode: "insensitive" }
  else if (tags) where.tags = { contains: tags, mode: "insensitive" }
  return where
}

const getPublicPostPage = cache(async (categoryId: number | undefined, title: string, tags: string, page: number, allowedCategoryIds: string) =>
  getPostsByPage({
    where: createWhere(categoryId, title, tags, allowedCategoryIds),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    page,
    pageSize: 10,
  })
)

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const access = await getBlogAccess()
  const categories = (await getPublicCategories()).filter((category) => access.categoryIds.has(category.id))
  const category = categoryFromParams(params, categories)
  const requestedCategory = Boolean(firstParam(params.cid) && firstParam(params.cid) !== "0")
  if (requestedCategory && !category) notFound()
  if (!requestedCategory && !access.keys.has(BLOG_PAGE_KEYS.articleList)) notFound()
  const searchTerm = getSearchTerm(params)
  const isSearch = Boolean(searchTerm || firstParam(params.title) || firstParam(params.tags) || firstParam(params.tag))
  const page = parsePositiveInt(params.page)
  const categoryId = category?.id
  const pageResult = !isSearch && !requestedCategory
    ? await getPublicPostPage(undefined, "", "", page, [...access.categoryIds].sort((a, b) => a - b).join(","))
    : category
      ? await getPublicPostPage(category.id, "", "", page, [...access.categoryIds].sort((a, b) => a - b).join(","))
      : undefined
  const hasIndexableContent = pageResult?.code === 200 && pageResult.data.totalPages > 0
  const canonical = absoluteSiteUrl(
    articleListPath({
      categoryId,
      page: !isSearch && page > 1 ? page : undefined,
    })
  )

  const title = isSearch
    ? `搜索：${searchTerm || "文章"}`
    : category
      ? `${category.name}相关文章${page > 1 ? ` - 第 ${page} 页` : ""}`
      : `文章列表${page > 1 ? ` - 第 ${page} 页` : ""}`
  const description = category
    ? `浏览${category.name}分类下已发布的文章与实践记录。`
    : "浏览博客已发布的技术文章、问题记录与实践经验。"

  return {
    ...createPublicPageMetadata({title, description, path: canonical}),
    ...(!hasIndexableContent || isSearch || (requestedCategory && !category)
      ? { robots: { index: false, follow: true } }
      : {}),
  }
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const access = await getBlogAccess()
  const categories = (await getPublicCategories()).filter((category) => access.categoryIds.has(category.id))
  const rawCategoryId = firstParam(params.cid)
  const category = categoryFromParams(params, categories)
  if (rawCategoryId && rawCategoryId !== "0" && !category) notFound()
  if ((!rawCategoryId || rawCategoryId === "0") && !access.keys.has(BLOG_PAGE_KEYS.articleList)) notFound()

  const page = parsePositiveInt(params.page)
  const title = firstParam(params.title)?.trim()
  const tags = (firstParam(params.tags) || firstParam(params.tag))?.trim()
  const allowedCategoryIds = [...access.categoryIds].sort((a, b) => a - b)
  const result = await getPublicPostPage(category?.id, title ?? "", tags ?? "", page, allowedCategoryIds.join(","))
  const resultData = result.code === 200 ? result.data : { list: [], totalPages: 0, currentPage: page }
  const totalPages = Math.max(resultData.totalPages, 1)
  if (page > totalPages) notFound()

  return (
    <ClientPageContainer
      key={JSON.stringify(params)}
      categories={categories}
      posts={resultData.list as PostListItem[]}
      page={page}
      totalPages={totalPages}
      categoryId={category?.id}
      search={{ title: title ?? "", tags: tags ?? "" }}
    />
  )
}
