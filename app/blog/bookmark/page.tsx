/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-29 16:25:24
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 00:51:33
 * @FilePath: \blog\app\blog\bookmark\page.tsx
 * @Description: 书签页：分类与分类下启用状态的书签
 */
import { Empty, Image, TextLine } from "@/components/k-view"
import { SUCCESS_CODE } from "@/lib/actionMessageBack"
import { getBookmarkCategoryList } from "@/service/bookmarkCategory"
import { bookmarkCategoryWithBookmarksInclude } from "@/types/bookmark"
import Link from "next/link"

export default async function BookmarkPage() {
  const res = await getBookmarkCategoryList({
    where: { status: 1 },
    include: bookmarkCategoryWithBookmarksInclude,
    orderBy: { id: "asc" },
  })

  const categories =
    res.code === SUCCESS_CODE && Array.isArray(res.data) ? res.data : []

  return (
    <>
      <div className="lg:h-[500px] lg:bg-center h-40  w-full bg-cover  bg-[url(/images/bg_banner.png)] ">

      </div>
      <div className="container pb-4">


        <div>
          {categories.map((cate) => (
            <div key={cate.id}>
              <h2 className="my-4 text-center text-2xl font-bold text-primary">{cate.name}</h2>
              {
                cate.bookmarks.length > 0 ?
                  <div className="grid grid-cols-1  lg:grid-cols-4 gap-4">
                    {cate.bookmarks.map((item) => (
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        href={item.url}
                        key={item.id}
                        className="h-28 group bg-card hover:bg-primary flex cursor-pointer items-center rounded-lg p-4 shadow-sm transition-all duration-500 hover:shadow-lg"
                      >
                        <span
                          className="inline-flex size-14 min-w-14 shrink-0 origin-top-left overflow-hidden opacity-100 scale-100 transition-all duration-500 ease-out group-hover:w-0 group-hover:min-w-0 group-hover:scale-0 group-hover:opacity-0 motion-reduce:transition-none motion-reduce:group-hover:h-14 motion-reduce:group-hover:w-14 motion-reduce:group-hover:min-w-14 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:opacity-100"
                        >
                          <Image
                            className="size-full shrink-0 rounded-full bg-background"
                            src={item.icon ?? ""}
                            fallback={item.title.substring(0, 1)}
                            alt={item.title}
                            objectFit="contain"
                          />
                        </span>
                        <div className="ml-4 min-w-0 flex-1 transition-[margin-left] duration-500 ease-out group-hover:ml-0">
                          <h3 className="text-base font-bold group-hover:text-white">{item.title}</h3>
                          <div className="text-sm text-gray-500 group-hover:text-gray-300 line-clamp-3">
                            <TextLine className="">{item.intro}</TextLine>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  : <Empty />
              }

            </div>
          ))}
        </div>
      </div>
    </>
  )
}
