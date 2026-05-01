import { z } from "zod"
import { addBookmarkSchema } from "@/validators/bookmark"
import { Prisma } from "@prisma/client"

export type { Bookmark, BookmarkCategory } from "@prisma/client"

export type addBookmarkParams = z.infer<typeof addBookmarkSchema>

export const bookmarkCategoryWithBookmarksInclude = {
  bookmarks: {
    where: { status: 1 },
  },
}

export type BookmarkCategoryWithBookmarks = Prisma.BookmarkCategoryGetPayload<{
  include: typeof bookmarkCategoryWithBookmarksInclude
}>
