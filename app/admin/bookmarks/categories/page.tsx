import type { Metadata } from "next"

import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { requirePageAccess } from "@/lib/admin-guard"
import { normalizePageSize } from "@/lib/paging"
import { getAdminBookmarkCategories } from "@/service/bookmarkCategory"
import { TableToolbar } from "../../components/TableToolbar"
import { BookmarkCategoriesTable, BookmarkCategoryToolbar } from "./BookmarkCategoriesTable"

export const metadata: Metadata = {title: "书签分类"}
export const dynamic = "force-dynamic"

const fields: FormFieldConfig[] = [
    {
        key: "keyword",
        type: "string",
        required: false,
        fieldConfig: {
            label: "分类名称",
            inputProps: {
                placeholder: "搜索分类…",
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
                options: [{label: "正常", value: "1"}, {label: "禁用", value: "0"}],
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

export default async function Page({searchParams}: {searchParams: Promise<{keyword?: string; status?: string; page?: string; pageSize?: string}>}) {
    await requirePageAccess("bookmarkCategories")
    const params = await searchParams
    const keyword = params.keyword?.trim() ?? ""
    const status = params.status === "0" || params.status === "1" ? params.status : ""
    const pageSize = normalizePageSize(params.pageSize)
    const data = await getAdminBookmarkCategories({keyword, status, page: Number(params.page) || 1, pageSize})

    return <div className="mx-auto w-full max-w-[1600px]">
        <TableBusyProvider>
            <div className="adm-rise mb-2"><FilterForm fields={fields} basePath="/admin/bookmarks/categories"/></div>
            <div className="adm-rise mb-2"><TableToolbar action={<BookmarkCategoryToolbar/>}/></div>
            <div className="adm-rise"><BookmarkCategoriesTable {...data} query={{keyword, status}}/></div>
        </TableBusyProvider>
    </div>
}
