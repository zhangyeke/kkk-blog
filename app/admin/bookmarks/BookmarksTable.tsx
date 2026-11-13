"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Ban, CircleCheck, ExternalLink } from "lucide-react"
import { toast } from "sonner"

import { AdminCreateToolbar } from "@/app/admin/components/AdminCreateToolbar"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { AdminForm } from "@/app/admin/components/AdminForm"
import { usePermission } from "@/components/admin/permission-context"
import { DataTable, type DataTableColumn } from "@/components/k-view/DataTable"
import { Empty } from "@/components/k-view/Empty"
import { Image } from "@/components/k-view/Image"
import { CopyText } from "@/components/k-view/Text/CopyText"
import { RemoteSelect } from "@/components/k-view/Form/components/RemoteSelectField"
import { type RowActionItem, RowActions } from "@/components/k-view/RowActions"
import { Tag } from "@/components/k-view/Tag"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import { formatDate } from "@/lib/date"
import type { AdminBookmarkRow } from "@/service/bookmark"
import { deleteAdminBookmark, saveAdminBookmark, updateAdminBookmarkStatus } from "@/service/bookmark"
import { addBookmarkSchema } from "@/validators/bookmark"

export function BookmarkToolbar({categories}: {categories: {id: number; name: string}[]}) {
    return (
        <AdminCreateToolbar
            permission="bookmark:create"
            buttonLabel="新增书签"
            dialogTitle="新增书签"
            dialog={{
                headerClassName: "border-[var(--adm-line)] px-5",
                contentClassName: "admin-shell admin-dialog-content w-[680px]",
            }}
            renderForm={({onCancel, onSuccess}) => (
                <AdminForm
                    schema={addBookmarkSchema}
                    defaultValues={{title: "", url: "", intro: "", icon: "", categoryId: categories[0]?.id ?? 0}}
                    save={(input: Parameters<typeof saveAdminBookmark>[0]) =>
                        saveAdminBookmark({...input, status: input.status === 0 ? 0 : 1})
                    }
                    submitParams={{status: 1}}
                    formComponents={{remoteSelect: (props) => <RemoteSelect {...props} options={categories}/>}}
                    onCancel={onCancel}
                    onSuccess={onSuccess}
                    successMessage="书签已创建"
                />
            )}
        />
    )
}

export function BookmarksTable({rows, footer, categories}: {
    rows: AdminBookmarkRow[]
    footer?: React.ReactNode
    categories: {id: number; name: string}[]
}) {
    const router = useRouter()
    const {can} = usePermission()
    const {preset} = useAdminTheme()
    const {openDialog} = useRenderDialog()
    const busy = useTableBusy()

    function handleEditClick(row: AdminBookmarkRow) {
        openDialog({title: "编辑书签", headerClassName: "border-[var(--adm-line)] px-5",
            contentClassName: "admin-shell admin-dialog-content w-[680px]",
            contentProps: {showCloseButton: false, "data-preset": preset},
            render: ({close, onCancel}) => (
                <AdminForm
                    schema={addBookmarkSchema}
                    defaultValues={{
                        title: row.title,
                        url: row.url,
                        intro: row.intro ?? "",
                        icon: row.icon ?? "",
                        categoryId: row.categoryId,
                    }}
                    save={(input: Parameters<typeof saveAdminBookmark>[0]) =>
                        saveAdminBookmark({...input, status: input.status === 0 ? 0 : 1})
                    }
                    submitParams={{id: row.id, status: row.status === 0 ? 0 : 1}}
                    formComponents={{remoteSelect: (props) => <RemoteSelect {...props} options={categories}/>}}
                    onCancel={onCancel}
                    onSuccess={() => {close(); router.refresh()}}
                    successMessage="书签已更新"
                />
            ),
        })
    }

    async function handleDelete(row: AdminBookmarkRow) {
        const result = await deleteAdminBookmark(row.id)
        if (result.code === 200) toast.success(result.message)
        else toast.error(result.message)
    }

    /** 启用 / 禁用：与文章列表的「发布 / 下架」同一套交互，RowActions 会自动 refresh */
    async function handleToggleStatus(id: number, status: 0 | 1) {
        const result = await updateAdminBookmarkStatus(id, status)
        if (result.code === 200) toast.success(result.message)
        else toast.error(result.message || "操作失败")
    }

    const columns: DataTableColumn<AdminBookmarkRow>[] = [
        {
            key: "title",
            title: "书签",
            render: (row) => (
                <div className="flex items-center gap-2.5">
                    {row.icon ? (
                        <Image
                            src={row.icon}
                            alt=""
                            objectFit="contain"
                            fallback={(row.title || row.url).slice(0, 1).toUpperCase()}
                            className="size-7 rounded-md  border-[var(--adm-line-2)] bg-[var(--adm-paper-2)]"
                        />
                    ) : (
                        <span
                            className="grid size-7 shrink-0 place-items-center rounded-md text-xs md:text-sm"
                            style={{background: "var(--adm-paper-3)", color: "var(--adm-c1)"}}
                        >
                            {(row.title || row.url).slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <div>
                        <CopyText text={row.title} showIcon className="text-sm md:text-base" style={{color: "var(--adm-ink)"}}>
                            {row.title}
                        </CopyText>
                        {row.intro && (
                            <div className="text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>
                                {row.intro}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "url",
            title: "链接",
            // 链接是这一页唯一的新标签页入口，窄屏不能靠 hideOnMobile 藏掉，
            // 否则去掉操作栏按钮后就没有任何地方能打开它了——让它参与横向滚动
            render: (row) => (
                <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={row.url}
                    onClick={(event) => event.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs md:text-sm underline-offset-2 hover:underline"
                    style={{color: "var(--adm-ink-3)"}}
                >
                    <span>{row.url}</span>
                    <ExternalLink className="size-3" aria-hidden="true"/>
                </a>
            ),
        },
        {
            key: "categoryName",
            title: "分类",
            className: "text-sm md:text-base text-[var(--adm-ink-2)]",
            hideOnMobile: true,
        },
        {
            key: "status",
            title: "状态",
            render: (row) => <Tag tone={row.status === 1 ? "success" : "muted"} appearance="soft" size="sm">{row.status === 1 ? "正常" : "禁用"}</Tag>,
        },
        {
            key: "createdAt",
            title: "添加",
            align: "right",
            hideOnMobile: true,
            render: (row) => (
                <span className="tabular-nums text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>
                    {formatDate(row.createdAt)}
                </span>
            ),
        },
        {
            key: "actions", title: "操作", fixed: "right", align: "right",
            render: (row) => {
                const statusAction: RowActionItem = row.status === 1
                    ? {
                        key: "disable", kind: "custom", label: `禁用「${row.title}」`,
                        icon: <Ban className="size-3.5"/>, tone: "danger",
                        permission: "bookmark:update",
                        confirmTitle: "确认禁用",
                        confirmText: `禁用后「${row.title}」不再展示在前台，确定继续？`,
                        confirmLabel: "禁用",
                        onClick: () => handleToggleStatus(row.id, 0),
                    }
                    : {
                        key: "enable", kind: "custom", label: `启用「${row.title}」`,
                        icon: <CircleCheck className="size-3.5"/>,
                        permission: "bookmark:update",
                        onClick: () => handleToggleStatus(row.id, 1),
                    }

                return <RowActions can={can} actions={[
                    {key: "edit", kind: "edit", label: "编辑", permission: "bookmark:update",
                        onClick: () => handleEditClick(row)},
                    statusAction,
                    {key: "delete", kind: "delete", label: `删除「${row.title}」`,
                        confirmText: `确定删除「${row.title}」？此操作不可撤销。`,
                        permission: "bookmark:delete", onClick: () => handleDelete(row)},
                ]}/>
            },
        },
    ]

    return (
        <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            footer={footer}
            caption="书签列表"
            busy={busy.pending}
            empty={<Empty type="search" text="没有符合条件的书签" description="换个筛选条件，或新增一个书签"/>}
        />
    )
}
