"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AdminCreateToolbar } from "@/app/admin/components/AdminCreateToolbar"
import { AdminForm } from "@/app/admin/components/AdminForm"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { usePermission } from "@/components/admin/permission-context"
import { DataTable, type DataTableColumn, DataTablePager } from "@/components/k-view/DataTable"
import { RowActions } from "@/components/k-view/RowActions"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import { formatDate } from "@/lib/date"
import { deleteAdminBookmarkCategory, saveAdminBookmarkCategory } from "@/service/bookmarkCategory"
import { type BookmarkCategoryFormValue, bookmarkCategorySchema } from "@/validators/bookmarkCategory"

type Row = { id: number; name: string; status: number; bookmarkCount: number; createdAt: Date }

function renderBookmarkCategoryForm(editing: Row | undefined, onCancel: () => void, onSuccess: () => void) {
  return (
    <AdminForm
      schema={bookmarkCategorySchema}
      defaultValues={{name: editing?.name ?? "", status: editing?.status === 0 ? 0 : 1}}
      save={(input: BookmarkCategoryFormValue) =>
        saveAdminBookmarkCategory({
          id: editing?.id,
          name: input.name,
          status: input.status === 0 ? 0 : 1,
        })
      }
      onCancel={onCancel}
      onSuccess={onSuccess}
      successMessage={editing ? "分类已更新" : "分类已创建"}
    />
  )
}

export function BookmarkCategoryToolbar() {
  return (
    <AdminCreateToolbar
      permission="bookmarkCategory:create"
      buttonLabel="新增分类"
      dialogTitle="新增书签分类"
      dialog={{
        headerClassName: "border-[var(--adm-line)] px-5",
        contentClassName: "admin-shell admin-dialog-content w-[600px]",
      }}
      renderForm={({onCancel, onSuccess}) => renderBookmarkCategoryForm(undefined, onCancel, onSuccess)}
    />
  )
}

export function BookmarkCategoriesTable({
  list,
  total,
  page,
  pageSize,
  totalPages,
  query,
}: {
  list: Row[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  query: { keyword: string; status: string }
}) {
  const router = useRouter()
  const { can } = usePermission()
  const { preset } = useAdminTheme()
  const { openDialog } = useRenderDialog()
  const busy = useTableBusy()

  function handleEditClick(row: Row) {
    openDialog({
      title: "编辑书签分类",
      headerClassName: "border-[var(--adm-line)] px-5",
      contentClassName: "admin-shell admin-dialog-content w-[600px]",
      contentProps: { showCloseButton: false, "data-preset": preset },
      render: ({close, onCancel}) =>
        renderBookmarkCategoryForm(row, onCancel, () => {
          close()
          router.refresh()
        }),
    })
  }

  async function handleDelete(row: Row) {
    const result = await deleteAdminBookmarkCategory(row.id)
    if (result.code === 200) toast.success(result.message)
    else toast.error(result.message)
  }

  const columns: DataTableColumn<Row>[] = [
    { key: "name", title: "分类名称", copy: true, className: "adm-serif text-sm md:text-base" },
    { key: "bookmarkCount", title: "书签数", align: "right" },
    { key: "status", title: "状态", render: (row) => (row.status === 1 ? "正常" : "禁用") },
    {
      key: "createdAt",
      title: "创建时间",
      hideOnMobile: true,
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      title: "操作",
      fixed: "right",
      align: "right",
      render: (row) => (
        <RowActions
          can={can}
          actions={[
            {
              key: "edit",
              kind: "edit",
              label: "编辑",
              permission: "bookmarkCategory:update",
              onClick: () => handleEditClick(row),
            },
            {
              key: "delete",
              kind: "delete",
              label: `删除「${row.name}」`,
              permission: "bookmarkCategory:delete",
              confirmText:
                row.bookmarkCount > 0
                  ? `该分类下还有 ${row.bookmarkCount} 个书签，请先迁移或删除。`
                  : `确定删除「${row.name}」？`,
              onClick: () => handleDelete(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={list}
      rowKey={(row) => row.id}
      caption="书签分类列表"
      busy={busy.pending}
      footer={
        total > 0 ? (
          <DataTablePager
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            basePath="/admin/bookmarks/categories"
            query={query}
            onNavigate={(href) => busy.run(() => router.push(href))}
            pending={busy.pending}
          />
        ) : undefined
      }
    />
  )
}
