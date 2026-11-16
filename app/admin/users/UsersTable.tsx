"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { AdminCreateToolbar } from "@/app/admin/components/AdminCreateToolbar"
import { usePermission } from "@/components/admin/permission-context"
import { DataTable, type DataTableColumn, DataTablePager } from "@/components/k-view/DataTable"
import { Empty } from "@/components/k-view/Empty"
import { type RowActionItem, RowActions } from "@/components/k-view/RowActions"
import { Tag } from "@/components/k-view/Tag"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { AdminForm } from "@/app/admin/components/AdminForm"
import { AdminUserAvatar } from "@/app/admin/components/AdminUserAvatar"
import { formatDate } from "@/lib/date"
import { type AdminUserRow, createAdminUser, deleteAdminUser, updateAdminUser } from "@/service/admin/users"
import { SelectField } from "@/components/k-view/Form/components/SelectField"
import { adminUserFormSchema, type AdminUserFormValue } from "@/validators/user"

export type UserRoleOption = { code: string; name: string }

export function UsersToolbar({roleOptions}: {roleOptions: UserRoleOption[]}) {
  return (
    <AdminCreateToolbar
      permission="user:manage"
      buttonLabel="新增用户"
      dialogTitle="新增用户"
      disabled={roleOptions.length === 0}
      testId="user-create-trigger"
      dialog={{
        headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
        titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
        contentClassName: "z-50 admin-shell admin-dialog-content w-[540px]",
      }}
      renderForm={({onCancel, onSuccess}) => (
        <AdminForm
          schema={adminUserFormSchema}
          defaultValues={{name: "", email: "", roles: roleOptions[0]?.code ?? "", avatar: "", password: ""}}
          save={(input: AdminUserFormValue) => createAdminUser(input)}
          formComponents={{
            userRoleSelect: (props) => (
              <SelectField {...props} options={roleOptions.map((role) => ({label: role.name, value: role.code}))}/>
            ),
          }}
          onCancel={onCancel}
          onSuccess={onSuccess}
          successMessage="用户已创建"
          submitLabel="保存"
          pendingLabel="保存中…"
          submitDisabled={roleOptions.length === 0}
        />
      )}
    />
  )
}

export type UsersTableProps = {
  rows: AdminUserRow[]
  page: number
  pageSize: number
  totalPages: number
  total: number
  roleOptions: UserRoleOption[]
  roleNames: Record<string, string>
  currentUserId: string
  query: { keyword?: string; role?: string }
}

/**
 * 用户列表。
 *
 * 与 posts 表格同构：服务端只给数据，带 render 的列定义放客户端；
 * 翻页 / 筛选 / 刷新走 `useTableBusy` 盖蒙层而不是整页转圈；
 * 行操作统一用 `RowActions`（图标按钮 + 删除二次确认），和后台其它表格一致。
 *
 * 用户管理提供新增、资料与角色编辑、删除。自己的账号不显示编辑 / 删除，
 * 避免误锁死后台。
 */
export function UsersTable({
  rows,
  page,
  pageSize,
  totalPages,
  total,
  roleOptions,
  roleNames,
  currentUserId,
  query,
}: UsersTableProps) {
  const router = useRouter()
  const { can } = usePermission()
  const { openDialog } = useRenderDialog()
  const { preset } = useAdminTheme()
  // 翻页 / 筛选 / 刷新时保留旧数据，只在表格上盖一层蒙层
  const busy = useTableBusy()

  function handleEditClick(row: AdminUserRow) {
    openDialog({
      title: "编辑用户",
      headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
      titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
      contentClassName: "z-50 admin-shell admin-dialog-content w-[540px]",
      contentProps: { showCloseButton: false, "data-preset": preset },
      render: ({ close, onCancel }) => (
        <AdminForm
          schema={adminUserFormSchema}
          defaultValues={{
            name: row.name ?? "",
            email: row.email ?? "",
            roles: row.roles.split(",")[0]?.trim() ?? roleOptions[0]?.code ?? "",
            avatar: row.avatar ?? "",
            password: "",
          }}
          save={(input: AdminUserFormValue) => updateAdminUser({ id: row.id, ...input })}
          formComponents={{
            userRoleSelect: (props) => (
              <SelectField {...props} options={roleOptions.map((role) => ({ label: role.name, value: role.code }))} />
            ),
          }}
          onCancel={onCancel}
          onSuccess={() => {
            close()
            router.refresh()
          }}
          successMessage="用户信息已更新"
          submitLabel="保存"
          pendingLabel="保存中…"
          submitDisabled={roleOptions.length === 0}
        />
      ),
    })
  }

  async function handleDelete(row: AdminUserRow) {
    const result = await deleteAdminUser(row.id)
    if (result.code === 200) toast.success(result.message || "已删除")
    else toast.error(result.message || "删除失败")
  }

  const columns: DataTableColumn<AdminUserRow>[] = [
    {
      key: "name",
      title: "用户名",
      copy: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <AdminUserAvatar name={row.name} avatar={row.avatar} sizeClassName="size-7" className="text-xs md:text-sm" />
          <div className="text-sm md:text-base" style={{ color: "var(--adm-ink)" }}>
            {row.name}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      title: "邮箱",
      copy: true,
      className: "text-xs md:text-sm text-[var(--adm-ink-3)]",
    },
    {
      key: "roles",
      title: "角色",
      render: (row) => {
        const isOwner = row.roles === "superAdmin"
        const roleName = roleNames[row.roles]
        return (
          <Tag
            tone={isOwner ? "danger" : "neutral"}
            appearance={isOwner ? "soft" : "outline"}
            size="sm"
            icon={isOwner ? <ShieldCheck className="size-3" /> : undefined}
          >
            {roleName ?? row.roles}
          </Tag>
        )
      },
    },
    {
      key: "postCount",
      title: "文章",
      align: "right",
      hideOnMobile: true,
      className: "tabular-nums text-sm md:text-base text-[var(--adm-ink-2)]",
    },
    {
      key: "createdAt",
      title: "加入",
      align: "right",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs tabular-nums md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      fixed: "right",
      align: "right",
      render: (row) => {
        // 自己的账号不能改角色 / 删除，否则可能把唯一的管理员清掉
        if (row.id === currentUserId) {
          return (
            <span className="text-xs md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
              当前账号
            </span>
          )
        }

        const actions: RowActionItem[] = [
          {
            key: "edit",
            kind: "edit",
            label: `编辑「${row.name}」`,
            permission: "user:manage",
            onClick: () => handleEditClick(row),
          },
          ...(row.postCount === 0
            ? [
                {
                  key: "delete",
                  kind: "delete",
                  label: `删除「${row.name}」`,
                  permission: "user:manage",
                  confirmText: `确定删除「${row.name}」？此操作不可撤销。`,
                  onClick: () => handleDelete(row),
                } satisfies RowActionItem,
              ]
            : []),
        ]
        return (
          <div className="flex items-center justify-end gap-2">
            {row.postCount > 0 && (
              <span className="text-xs" style={{ color: "var(--adm-ink-3)" }}>
                有文章，不能删除
              </span>
            )}
            <RowActions actions={actions} can={can} />
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.id}
      caption="用户列表"
      busy={busy.pending}
      empty={<Empty type="search" text="没有匹配的用户"/>}
      footer={
        total > 0 ? (
          <DataTablePager
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            total={total}
            basePath="/admin/users"
            query={{ keyword: query.keyword, role: query.role }}
            onNavigate={(href) => busy.run(() => router.push(href))}
            pending={busy.pending}
          />
        ) : undefined
      }
    />
  )
}
