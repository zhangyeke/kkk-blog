import type { Metadata } from "next"

import { FilterForm } from "@/components/k-view/FilterForm"
import type { FormFieldConfig } from "@/components/k-view/Form"
import { TableBusyProvider } from "@/components/k-view/DataTable/busy"
import { requirePageAccess } from "@/lib/admin-guard"
import { getMenuRows } from "@/lib/admin-menu-store"
import { getAllowedKeys } from "@/lib/permission-store"
import { getRoleListView, type RoleListView } from "@/service/role"
import { type RoleQuery, RolesTable } from "./RolesTable"

export const metadata: Metadata = {title: "角色管理"}
export const dynamic = "force-dynamic"

type SearchParams = {
    keyword?: string
    type?: string
    status?: string
}

/** 读失败时的空壳，保证客户端组件永远拿到合法 props */
const EMPTY_VIEW: RoleListView = {rows: [], total: 0}

export default async function Page({searchParams}: {searchParams: Promise<SearchParams>}) {
    const params = await searchParams
    const user = await requirePageAccess("roles")

    const query: RoleQuery = {
        keyword: params.keyword?.trim() ?? "",
        type: params.type === "builtin" || params.type === "custom" ? params.type : "all",
        status: params.status === "0" || params.status === "1" ? params.status : "all",
    }

    /*
     * 三份数据并发取：
     * - 角色列表（服务端按 URL 条件过滤，成员数 / 权限数在这里算好）
     * - 当前用户的权限 key 全集（按钮显隐的兜底，与 usePermission 同源）
     * - 菜单行（分配权限弹窗要按菜单树渲染 checkbox，树必须来自同一份菜单数据）
     */
    const [result, allowed, menuRows] = await Promise.all([
        getRoleListView({keyword: query.keyword, type: query.type, status: query.status}),
        getAllowedKeys(user.roles),
        getMenuRows(),
    ])

    const data = result.code === 200 ? result.data : EMPTY_VIEW
    const fields: FormFieldConfig[] = [
        {
            key: "keyword",
            type: "string",
            required: false,
            fieldConfig: {
                label: "角色",
                inputProps: {
                    placeholder: "角色名称 / 标识…",
                    className: "h-8 w-full text-sm md:text-base sm:w-[var(--field-w)]",
                    style: {"--field-w": "220px"},
                },
            },
            options: [],
            schema: [],
        },
        {
            key: "type",
            type: "select",
            required: false,
            fieldConfig: {
                label: "类型",
                fieldType: "select",
                inputProps: {
                    placeholder: "全部类型",
                    options: [
                        {label: "内置", value: "builtin"},
                        {label: "自定义", value: "custom"},
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
                        {label: "停用", value: "0"},
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

    /*
     * 容器必须是 flex + min-h-0 的纵向三段式（工具条 / 表格 / 分页），
     * 否则 1440×900 下页面会出现整页滚动条（和菜单管理页保持同一套布局约定）。
     */
    return (
        <div className="flex h-full min-h-0 flex-col">
            <TableBusyProvider>
                <div className="adm-rise mb-2 shrink-0"><FilterForm fields={fields} basePath="/admin/users/roles"/></div>
                <RolesTable rows={data.rows} total={data.total} allowed={allowed} menuRows={menuRows} query={query}/>
            </TableBusyProvider>
        </div>
    )
}
