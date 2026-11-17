import type { Metadata } from "next"

import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { requirePageAccess, scopeOf } from "@/lib/admin/guard"
import { normalizePageSize } from "@/lib/paging"
import { getAdminPostFilterOptions, getAdminPosts } from "@/service/post"
import { TableToolbar } from "../components/TableToolbar"
import { PostsTable, PostToolbar } from "./PostsTable"

export const metadata: Metadata = { title: "文章" }

export const dynamic = "force-dynamic"

type SearchParams = {
  page?: string
  pageSize?: string
  status?: string
  title?: string
  categoryId?: string
  authorId?: string
}

const toNumber = (value: string | undefined) => {
  if (value == null || value === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const user = await requirePageAccess("posts")
  const scope = scopeOf(user)

  const page = Number(params.page ?? "1") || 1
  const pageSize = normalizePageSize(params.pageSize)
  const filters = {
    status: toNumber(params.status),
    title: params.title?.trim() || undefined,
    categoryId: toNumber(params.categoryId),
    authorId: params.authorId || undefined,
  }

  // 列表与筛选项并发取，避免串行请求
  const [result, optionsResult] = await Promise.all([
    getAdminPosts(scope, { page, pageSize, ...filters }),
    getAdminPostFilterOptions(scope),
  ])

  const data = result.code === 200 ? result.data : { list: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }
  const options = optionsResult.code === 200 ? optionsResult.data : { categories: [], authors: [] }

  const fields: FormFieldConfig[] = [
    {
      key: "title",
      type: "string",
      required: false,
      fieldConfig: {
        label: "标题",
        inputProps: {
          placeholder: "搜索标题…",
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
          options: options.categories.map((item) => ({ label: item.name, value: String(item.id) })),
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
          options: [
            { label: "已发布", value: "1" },
            { label: "草稿", value: "2" },
            { label: "已下架", value: "0" },
          ],
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
    ...(scope.all
      ? [
          {
            key: "authorId",
            type: "select",
            required: false,
            fieldConfig: {
              label: "作者",
              fieldType: "select",
              inputProps: {
                placeholder: "全部作者",
                options: options.authors.map((item) => ({ label: item.name, value: String(item.id) })),
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
      : []),
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* 只提供 pending/run 的 context，不产出 DOM，保持原有布局与滚动高度不变 */}
      <TableBusyProvider>
        <div className="adm-rise mb-2" style={{ ["--i" as string]: 1 }}>
          <FilterForm fields={fields} basePath="/admin/posts" />
        </div>

        {/* 工具条独立成行，坐在表格卡片上方。新增改成弹窗，状态在客户端组件里 */}
        <div className="adm-rise mb-2" style={{ ["--i" as string]: 2 }}>
          <TableToolbar action={<PostToolbar />} />
        </div>

        <div className="adm-rise" style={{ ["--i" as string]: 3 }}>
          <PostsTable
            rows={data.list}
            page={data.page}
            pageSize={data.pageSize}
            totalPages={data.totalPages}
            total={data.total}
            query={{
              status: filters.status,
              title: filters.title,
              categoryId: filters.categoryId,
              authorId: filters.authorId,
            }}
          />
        </div>
      </TableBusyProvider>
    </div>
  )
}
