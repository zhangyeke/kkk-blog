import { BLOG_MENU_SEED } from "@/lib/admin/menu-seed"
import { addBlogCategoryMenuRows } from "@/lib/blog/menu"

describe("addBlogCategoryMenuRows", () => {
  it("creates a role-addressable link for each category and preserves disabled rows", () => {
    const rows = addBlogCategoryMenuRows(BLOG_MENU_SEED, [
      { id: 12, name: "前端", status: 1 },
      { id: 34, name: "归档分类", status: 0 },
    ])

    expect(rows).toHaveLength(BLOG_MENU_SEED.length + 2)
    expect(rows.slice(-2)).toEqual([
      expect.objectContaining({
        id: -12,
        surface: "BLOG",
        parentId: 1004,
        name: "前端",
        path: "/blog/article/list?cid=12",
        permissionKey: "blog:category:12",
        status: 1,
        generatedFromCategory: true,
      }),
      expect.objectContaining({
        id: -34,
        surface: "BLOG",
        parentId: 1004,
        name: "归档分类",
        path: "/blog/article/list?cid=34",
        permissionKey: "blog:category:34",
        status: 0,
        generatedFromCategory: true,
      }),
    ])
  })
})
