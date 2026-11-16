import type { Metadata } from "next"

import { requirePageAccess, scopeOf } from "@/lib/admin-guard"
import { normalizePageSize } from "@/lib/paging"
import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { getAdminUserFilterOptions, getAdminUsers } from "@/service/admin/users"
import {TableToolbar} from "../components/TableToolbar"
import { UsersTable, UsersToolbar } from "./UsersTable"

export const metadata: Metadata = {title: "用户"}
export const dynamic = "force-dynamic"

type SearchParams = {
    page?: string
    pageSize?: string
    keyword?: string
    role?: string
}

export default async function Page({searchParams}: {searchParams: Promise<SearchParams>}) {
    const params = await searchParams
    const user = await requirePageAccess("users")
    const scope = scopeOf(user)

    const page = Number(params.page ?? "1") || 1
    const pageSize = normalizePageSize(params.pageSize)
    const keyword = params.keyword?.trim() || undefined
    const role = params.role?.trim() || undefined

    // 列表与筛选项并发取，避免串行请求（与 posts 页同口径）
    const [result, optionsResult] = await Promise.all([
        getAdminUsers(scope, {page, pageSize, keyword, role}),
        getAdminUserFilterOptions(),
    ])

    const data = result.code === 200 ? result.data : {list: [], total: 0, page: 1, pageSize: 10, totalPages: 1}
    const roleOptions = optionsResult.code === 200 ? optionsResult.data.roles : []
    const roleNames = optionsResult.code === 200 ? optionsResult.data.roleNames : {}

    const fields: FormFieldConfig[] = [
        {
            key: "keyword",
            type: "string",
            required: false,
            fieldConfig: {
                label: "昵称 / 邮箱",
                inputProps: {
                    placeholder: "搜索昵称或邮箱…",
                    className: "h-8 w-full text-sm md:text-base sm:w-[var(--field-w)]",
                    style: {"--field-w": "240px"},
                },
            },
            options: [],
            schema: [],
        },
        {
            key: "role",
            type: "select",
            required: false,
            fieldConfig: {
                label: "角色",
                fieldType: "select",
                inputProps: {
                    placeholder: "全部角色",
                    options: roleOptions.map((item) => ({label: item.name, value: item.code})),
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
            {/* 只提供 pending/run 的 context，不产出 DOM，保持原有布局与滚动高度不变 */}
            <TableBusyProvider>
                <div className="adm-rise mb-2" style={{["--i" as string]: 1}}>
                    <FilterForm fields={fields} basePath="/admin/users"/>
                </div>

                <div className="adm-rise mb-2" style={{["--i" as string]: 2}}>
                    <TableToolbar action={<UsersToolbar roleOptions={roleOptions}/>}/>
                </div>

                <div className="adm-rise" style={{["--i" as string]: 3}}>
                    <UsersTable
                        rows={data.list}
                        page={data.page}
                        pageSize={data.pageSize}
                        totalPages={data.totalPages}
                        total={data.total}
                        roleOptions={roleOptions}
                        roleNames={roleNames}
                        currentUserId={user.id}
                        query={{keyword, role}}
                    />
                </div>
            </TableBusyProvider>
        </div>
    )
}
