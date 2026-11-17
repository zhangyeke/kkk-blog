import { SUCCESS_CODE } from "@/lib/actionMessageBack"
import { getBookmarkCategoryList } from "@/service/bookmarkCategory"
import { bookmarkCategoryWithBookmarksInclude } from "@/types/bookmark"
import { PageContainer } from "./PageContainer"
import { createPublicPageMetadata } from "@/lib/seo/metadata"
import { BLOG_PAGE_KEYS, requireBlogPageAccess } from "@/lib/blog/permissions"

export const metadata = createPublicPageMetadata({
  title: "书签",
  description: "整理实用网站、开发工具与阅读资源，按分类快速发现收藏链接。",
  path: "/blog/bookmark",
})

export default async function BookmarkPage() {
  await requireBlogPageAccess(BLOG_PAGE_KEYS.bookmarks)
  const res = await getBookmarkCategoryList({
    where: { status: 1 },
    include: bookmarkCategoryWithBookmarksInclude,
    orderBy: { id: "asc" },
  })

  const categories = res.code === SUCCESS_CODE && Array.isArray(res.data) ? res.data : []

  return <PageContainer data={categories} />
}
