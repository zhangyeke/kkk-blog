import type { Metadata } from "next"

import { requirePageAccess } from "@/lib/admin-guard"
import { normalizePageSize } from "@/lib/paging"
import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { type AdminPostCategoryList, getAdminPostCategoryList } from "@/service/postCategory"
import { TableToolbar } from "../../components/TableToolbar"
import { CategoriesTable, type CategoryQuery, CategoryToolbar } from "./CategoriesTable"

export const metadata: Metadata = {title: "文章分类"}
export const dynamic = "force-dynamic"

type SearchParams = {
    keyword?: string
    status?: string
    page?: string
    pageSize?: string
}

/** 读失败时的空壳，保证客户端组件永远拿到合法 props */
const EMPTY: AdminPostCategoryList = {list: [], total: 0, page: 1, pageSize: 10, totalPages: 1}

export default async function Page({searchParams}: {searchParams: Promise<SearchParams>}) {
    const params = await searchParams
    await requirePageAccess("postCategories")

    const page = Number(params.page ?? "1") || 1
    const pageSize = normalizePageSize(params.pageSize)
    const query: CategoryQuery = {
        keyword: params.keyword?.trim() ?? "",
        status: params.status === "0" || params.status === "1" ? params.status : "all",
    }

    const result = await getAdminPostCategoryList({keyword: query.keyword, status: query.status, page, pageSize})
    const data = result.code === 200 ? result.data : EMPTY

    const fields: FormFieldConfig[] = [
        {
            key: "keyword",
            type: "string",
            required: false,
            fieldConfig: {
                label: "分类名称",
                inputProps: {
                    placeholder: "搜索分类名称…",
                    className: "h-8 w-full text-sm md:text-base sm:w-[var(--field-w)]",
                    style: {"--field-w": "220px"},
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
                        {label: "正常", value: "1"},
                        {label: "禁用", value: "0"},
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
    ]

    return (
        <div className="mx-auto w-full max-w-[1600px]">
            <TableBusyProvider>
                <div className="adm-rise mb-2">
                    <FilterForm fields={fields} basePath="/admin/posts/categories"/>
                </div>
                <div className="adm-rise mb-2">
                    <TableToolbar action={<CategoryToolbar/>}/>
                </div>
                <div className="adm-rise">
                    <CategoriesTable
                        rows={data.list}
                        page={data.page}
                        pageSize={data.pageSize}
                        totalPages={data.totalPages}
                        total={data.total}
                        query={query}
                    />
                </div>
            </TableBusyProvider>
        </div>
    )
}
