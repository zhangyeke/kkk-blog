"use client"

import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { AdminCreateToolbar } from "@/app/admin/components/AdminCreateToolbar"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { AdminForm } from "@/app/admin/components/AdminForm"
import { usePermission } from "@/components/admin/permission-context"
import { DataTable, type DataTableColumn, DataTablePager } from "@/components/k-view/DataTable"
import { Empty } from "@/components/k-view/Empty"
import { type RowActionItem, RowActions } from "@/components/k-view/RowActions"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import type { AdminStatusFilter } from "@/assets/enumerate/global"
import { formatDate } from "@/lib/date"
import { type AdminPostCategoryRow, createAdminPostCategory, deleteAdminPostCategory, updateAdminPostCategory } from "@/service/postCategory"
import { type PostCategoryFormValue, postCategorySchema } from "@/validators/postCategory"
import { AdminIcon } from "../../components/admin-icons"
import { CategoryStatusSwitch } from "./CategoryStatusSwitch"

export type CategoryQuery = { keyword: string; status: AdminStatusFilter }

export type CategoriesTableProps = {
    rows: AdminPostCategoryRow[]
    page: number
    pageSize: number
    totalPages: number
    total: number
    query: CategoryQuery
}

export function CategoryToolbar() {
    return (
        <AdminCreateToolbar
            permission="postCategory:create"
            buttonLabel="新增分类"
            dialogTitle="新增分类"
            testId="category-create"
            dialog={{
                headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
                titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
                contentClassName: "admin-shell admin-dialog-content w-[500px]",
            }}
            renderForm={({onCancel, onSuccess}) => (
                <AdminForm
                    schema={postCategorySchema}
                    defaultValues={{name: "", icon: "", status: 1}}
                    save={(input: PostCategoryFormValue) => createAdminPostCategory(input)}
                    onCancel={onCancel}
                    onSuccess={onSuccess}
                    successMessage="分类已创建"
                    submitTestId="category-form-submit"
                />
            )}
        />
    )
}

export function CategoriesTable({rows, page, pageSize, totalPages, total, query}: CategoriesTableProps) {
    const router = useRouter()
    const {can} = usePermission()
    const {preset} = useAdminTheme()
    const {openDialog} = useRenderDialog()
    const busy = useTableBusy()

    function handleEditClick(row: AdminPostCategoryRow) {
        openDialog({
            title: "修改分类",
            headerClassName: "border-[var(--adm-line)] px-5 text-left",
            titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
            contentClassName: "admin-shell admin-dialog-content w-[500px]",
            contentProps: {showCloseButton: false, "data-preset": preset},
            render: ({close, onCancel}) => {
                function handleSuccess() {
                    close()
                    router.refresh()
                }
                return (
                    <AdminForm
                        schema={postCategorySchema}
                        defaultValues={{name: row.name, icon: row.icon ?? "", status: row.status === 0 ? 0 : 1}}
                        save={(input: PostCategoryFormValue) => updateAdminPostCategory({...input, id: row.id})}
                        onCancel={onCancel}
                        onSuccess={handleSuccess}
                        successMessage="分类已更新"
                        submitTestId="category-form-submit"
                    />
                )
            },
        })
    }

    async function handleDelete(row: AdminPostCategoryRow) {
        const result = await deleteAdminPostCategory(row.id)
        if (result.code === 200) toast.success(result.message || "已删除")
        else toast.error(result.message || "删除失败")
    }

    const columns: DataTableColumn<AdminPostCategoryRow>[] = [
        {
            key: "name", title: "分类名称",
            className: "adm-serif text-sm md:text-base",
        },
        {
            key: "icon", title: "图标", align: "center",
            render: (row) => row.icon ? <AdminIcon name={row.icon} className="mx-auto size-[15px]"/> : "—",
        },
        {
            key: "postCount", title: "文章数", align: "right",
            className: "tabular-nums text-sm md:text-base",
        },
        {
            key: "status", title: "状态", align: "center",
            render: (row) => <CategoryStatusSwitch id={row.id} name={row.name} status={row.status} disabled={!can("postCategory:update")}/>,
        },
        {
            key: "createdAt", title: "创建时间", align: "right", hideOnMobile: true,
            render: (row) => <span className="tabular-nums text-xs md:text-sm text-[var(--adm-ink-3)]">{formatDate(row.createdAt)}</span>,
        },
        {
            key: "actions", title: "操作", align: "right", fixed: "right",
            render: (row) => {
                const actions: RowActionItem[] = [
                    {key: "edit", kind: "edit", label: "修改", permission: "postCategory:update", icon: <Pencil className="size-3.5"/>, onClick: () => handleEditClick(row)},
                    {key: "delete", kind: "delete", label: `删除「${row.name}」`, permission: "postCategory:delete",
                        confirmText: row.postCount > 0
                            ? `该分类下还有 ${row.postCount} 篇文章，请先迁移或删除文章。`
                            : `确定删除「${row.name}」？此操作不可撤销。`,
                        onClick: () => handleDelete(row)},
                ]
                return <RowActions actions={actions} can={can}/>
            },
        },
    ]

    return (
        <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            caption="文章分类列表"
            busy={busy.pending}
            empty={<Empty type="search" text="没有匹配的分类"/>}
            footer={total > 0 ? (
                <DataTablePager
                    page={page} totalPages={totalPages} total={total}
                    pageSize={pageSize}
                    basePath="/admin/posts/categories"
                    query={{keyword: query.keyword, status: query.status === "all" ? undefined : query.status}}
                    onNavigate={(href) => busy.run(() => router.push(href))}
                    pending={busy.pending}
                />
            ) : undefined}
        />
    )
}
