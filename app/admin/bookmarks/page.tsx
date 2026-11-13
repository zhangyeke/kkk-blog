import type { Metadata } from "next"

import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { requirePageAccess, scopeOf } from "@/lib/admin-guard"
import { normalizePageSize } from "@/lib/paging"
import { getAdminBookmarks } from "@/service/bookmark"
import { STATUS_OPTIONS } from "@/assets/enumerate/global"
import { getBookmarkCategoryList } from "@/service/bookmarkCategory"
import { TableBusyPager } from "../components/TableBusyPager"
import { TableToolbar } from "../components/TableToolbar"
import { BookmarksTable, BookmarkToolbar } from "./BookmarksTable"

export const metadata: Metadata = { title: "书签" }
export const dynamic = "force-dynamic"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; title?: string; categoryId?: string; status?: string }>
}) {
  const params = await searchParams
  const user = await requirePageAccess("bookmarks")
  const scope = scopeOf(user)
  const title = params.title?.trim() ?? ""
  const categoryId = Number(params.categoryId) || undefined
  const status = params.status === "0" || params.status === "1" ? Number(params.status) : undefined
  const pageSize = normalizePageSize(params.pageSize)
  const [result, categoriesResult] = await Promise.all([
    getAdminBookmarks(scope, { page: Number(params.page) || 1, pageSize, title, categoryId, status }),
    getBookmarkCategoryList(),
  ])
  const data = result.code === 200 ? result.data : { list: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }
  const categories = categoriesResult.code === 200 ? categoriesResult.data : []
  const activeCategories = categories
    .filter((item) => item.status === 1)
    .map((item) => ({ id: item.id, name: item.name }))
  const fields: FormFieldConfig[] = [
    {
      key: "title",
      type: "string",
      required: false,
      fieldConfig: {
        label: "标题",
        inputProps: {
          placeholder: "搜索书签…",
          className: "h-8 w-full text-sm md:text-base sm:w-[var(--field-w)]",
          style: { "--field-w": "220px" },
        },
      },
      options: [],
      schema: [],
    },
    {
      key: "categoryId",
      type: "select",
      required: false,
      fieldConfig: {
        label: "分类",
        fieldType: "select",
        inputProps: {
          placeholder: "全部分类",
          options: categories.map((item) => ({ label: item.name, value: String(item.id) })),
          className: "h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none transition-colors focus:border-[var(--adm-c2)] md:text-base sm:w-[var(--field-w)]",
          style: {
            "--field-w": "132px",
            borderColor: "var(--adm-line)",
            color: "var(--adm-ink)",
            background: "var(--adm-paper-2)",
          },
        },
      },
      options: [],
      schema: [],
    },
    {
      key: "status",
      type: "select",
      required: false,
      fieldConfig: {
        label: "状态",
        fieldType: "select",
        inputProps: {
          placeholder: "全部状态",
          options: STATUS_OPTIONS.map((option) => ({ ...option, value: String(option.value) })),
          className: "h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none transition-colors focus:border-[var(--adm-c2)] md:text-base sm:w-[var(--field-w)]",
          style: {
            "--field-w": "132px",
            borderColor: "var(--adm-line)",
            color: "var(--adm-ink)",
            background: "var(--adm-paper-2)",
          },
        },
      },
      options: [],
      schema: [],
    },
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      <TableBusyProvider>
        <div className="adm-rise mb-2">
          <FilterForm fields={fields} basePath="/admin/bookmarks" />
        </div>
        <div className="adm-rise mb-2">
          <TableToolbar action={<BookmarkToolbar categories={activeCategories} />} />
        </div>
        <div className="adm-rise">
          <BookmarksTable
            rows={data.list}
            categories={activeCategories}
            footer={
              data.total > 0 ? (
                <TableBusyPager
                  page={data.page}
                  pageSize={data.pageSize}
                  totalPages={data.totalPages}
                  total={data.total}
                  basePath="/admin/bookmarks"
                  query={{ title, categoryId, status }}
                />
              ) : undefined
            }
          />
        </div>
      </TableBusyProvider>
    </div>
  )
}
