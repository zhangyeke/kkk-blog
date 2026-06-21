import { SUCCESS_CODE } from "@/lib/actionMessageBack"
import { getBookmarkCategoryList } from "@/service/bookmarkCategory"
import { bookmarkCategoryWithBookmarksInclude } from "@/types/bookmark"
import { PageContainer } from "./PageContainer"

export const metadata = {
  title: "书签",
}

export default async function BookmarkPage() {
  const res = await getBookmarkCategoryList({
    where: { status: 1 },
    include: bookmarkCategoryWithBookmarksInclude,
    orderBy: { id: "asc" },
  })

  const categories = res.code === SUCCESS_CODE && Array.isArray(res.data) ? res.data : []

  return <PageContainer data={categories} />
}
