"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Archive, Send } from "lucide-react"
import { toast } from "sonner"
import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { AdminCreateToolbar } from "@/app/admin/components/AdminCreateToolbar"
import { AdminForm } from "@/app/admin/components/AdminForm"
import { GalleryModal } from "@/components/GalleryModal"
import { ArticleForm } from "@/app/blog/article/write/components/ArticleForm"

import { usePermission } from "@/components/admin/permission-context"
import { DataTable, type DataTableColumn, DataTablePager } from "@/components/k-view/DataTable"
import { Empty } from "@/components/k-view/Empty"
import { Image } from "@/components/k-view/Image"
import { type RowActionItem, RowActions } from "@/components/k-view/RowActions"
import { Tag } from "@/components/k-view/Tag"
import { useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"
import { useTableBusy } from "@/components/k-view/DataTable/busy"
import { formatRelative } from "@/lib/date"
import { postStatusLabel } from "@/lib/posts/status"
import { formatNumber } from "@/lib/number"
import { type AdminPostRow, deleteAdminPost, getAdminPostForEdit, updateAdminPostStatus } from "@/service/post"

async function handleDeletePost(postId: number) {
  const result = await deleteAdminPost(postId)
  if (result.code !== 200) toast.error(result.message || "删除失败")
}

/**
 * 下架 / 发布。传的是目标状态而不是「切换」，重复点击不会来回翻。
 * 这里不调 router.refresh()——RowActions 执行完 onClick 会统一刷新。
 */
async function handleTogglePostStatus(postId: number, status: 0 | 1) {
  const result = await updateAdminPostStatus(postId, status)
  if (result.code !== 200) {
    toast.error(result.message || (status === 1 ? "发布失败" : "下架失败"))
    return
  }
  toast.success(result.message || (status === 1 ? "已发布" : "已下架"))
}

export function PostToolbar() {
  return (
    <AdminCreateToolbar
      permission="post:create"
      buttonLabel="新增文章"
      dialogTitle="新建文章"
      testId="post-create-trigger"
      dialog={{
        headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
        titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
        contentClassName: "z-50 admin-shell admin-dialog-content admin-article-dialog",
      }}
      renderForm={({onCancel, onSuccess}) => (
        <ArticleForm variant="dialog" onCancel={onCancel} onSuccess={onSuccess}/>
      )}
    />
  )
}

/**
 * 表格列定义放在客户端组件里：服务端组件不能把带 render 函数的列配置传过来（函数不可序列化）。
 * 分页通过 DataTable 的 footer 插槽渲染，和表格共用一个圆角容器，看起来才是一体的。
 */
export function PostsTable({
  rows,
  page,
  pageSize,
  totalPages,
  total,
  query,
}: {
  rows: AdminPostRow[]
  page: number
  pageSize: number
  totalPages: number
  total: number
  query: Record<string, string | number | undefined>
}) {
  const { can } = usePermission()
  const router = useRouter()
  const { preset } = useAdminTheme()
  const { openDialog } = useRenderDialog()
  const [coverPreview, setCoverPreview] = React.useState<{ src: string; title: string } | null>(null)
  const coverPreviewTriggerRef = React.useRef<HTMLButtonElement | null>(null)
  // 翻页 / 筛选 / 刷新时保留旧数据，只在表格上盖一层蒙层
  const busy = useTableBusy()

  function handleCoverPreviewClick(row: AdminPostRow, trigger: HTMLButtonElement) {
    coverPreviewTriggerRef.current = trigger
    trigger.focus()
    setCoverPreview({ src: row.cover, title: row.title })
  }

  function handleCloseCoverPreview() {
    setCoverPreview(null)
    coverPreviewTriggerRef.current?.focus()
    coverPreviewTriggerRef.current = null
  }

  function handleEditClick(postId: number) {
    openDialog({
      title: "编辑文章",
      headerClassName: "shrink-0 border-[var(--adm-line)] px-5 text-left",
      titleClassName: "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
      contentClassName: "z-50 admin-shell admin-dialog-content admin-article-dialog",
      contentProps: {
        showCloseButton: false,
        "data-preset": preset,
      },
      render: ({ close, onCancel }) => {
        function handleEditSuccess() {
          close()
          router.refresh()
        }

        function handleLoadError(error: unknown) {
          toast.error(error instanceof Error ? error.message : "文章加载失败，请稍后再试")
          onCancel()
        }

        return (
          <AdminForm
            load={() => getAdminPostForEdit(postId)}
            render={(post) => (
              <ArticleForm
                postId={postId}
                defaultValue={post}
                variant="dialog"
                onCancel={onCancel}
                onSuccess={handleEditSuccess}
              />
            )}
            onLoadError={handleLoadError}
            loadingLabel="正在加载文章"
          />
        )
      },
    })
  }

  const columns: DataTableColumn<AdminPostRow>[] = [
    {
      key: "cover",
      title: "封面",
      render: (row) =>
        row.cover ? (
          <button
            type="button"
            aria-label={`预览《${row.title}》的封面`}
            className="cursor-zoom-in rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            onClick={(event) => handleCoverPreviewClick(row, event.currentTarget)}
          >
            <Image src={row.cover} alt="" className="h-9 w-16 rounded-md object-cover" />
          </button>
        ) : (
          <span className="text-muted-foreground flex h-9 w-16 items-center justify-center" aria-label="无封面">
            —
          </span>
        ),
    },
    {
      key: "title",
      title: "标题",
      copy: true,
      className: "adm-serif text-sm md:text-base",
    },
    {
      key: "authorName",
      title: "作者",
      copy: true,
      className: "text-sm md:text-base text-muted-foreground",
    },
    {
      key: "categoryName",
      title: "分类",
      copy: true,
      className: "text-sm md:text-base text-muted-foreground",
    },
    {
      key: "status",
      title: "状态",
      render: (row) => {
        const status = postStatusLabel(row.status)
        const tone = status.tone === "live" ? "success" : status.tone === "draft" ? "warning" : "muted"
        return <Tag tone={tone} appearance="soft" size="sm">{status.label}</Tag>
      },
    },
    {
      key: "pv",
      title: "浏览",
      align: "right",
      render: (row) => (
        <span className="text-sm md:text-base tabular-nums" style={{ color: "var(--adm-ink-2)" }}>
          {formatNumber(row.pv)}
        </span>
      ),
    },
    {
      key: "favoriteCount",
      title: "收藏",
      align: "right",
      className: "text-sm md:text-base tabular-nums text-[var(--adm-ink-2)]",
    },
    {
      key: "updatedAt",
      title: "更新",
      align: "right",
      className: "whitespace-nowrap",
      render: (row) => (
        <span className="text-xs md:text-sm tabular-nums" style={{ color: "var(--adm-ink-3)" }}>
          {formatRelative(row.updatedAt)}
        </span>
      ),
    },
    {
      key: "actions",
      title: "操作",
      fixed: "right",
      align: "right",
      render: (row) => {
        // status：0 下架 / 1 正常 / 2 草稿；null 是历史脏数据，按「已下架」处理
        const statusAction: RowActionItem =
          row.status === 1
            ? {
                key: "unpublish",
                kind: "custom",
                label: `下架《${row.title}》`,
                icon: <Archive className="size-3.5" />,
                tone: "danger",
                permission: "post:update",
                confirmTitle: "确认下架",
                confirmText: `下架《${row.title}》后，前台将立即不可见，确定继续？`,
                confirmLabel: "下架",
                onClick: () => handleTogglePostStatus(row.id, 0),
              }
            : {
                key: "publish",
                kind: "custom",
                label: `发布《${row.title}》`,
                icon: <Send className="size-3.5" />,
                permission: "post:update",
                onClick: () => handleTogglePostStatus(row.id, 1),
              }

        return (
          <RowActions
            can={can}
            actions={[
              {
                key: "edit",
                kind: "edit",
                label: "编辑",
                permission: "post:update",
                onClick: () => handleEditClick(row.id),
              },
              statusAction,
              {
                key: "delete",
                kind: "delete",
                label: `删除《${row.title}》`,
                confirmText: `确定删除《${row.title}》？此操作不可撤销。`,
                permission: "post:delete",
                onClick: () => handleDeletePost(row.id),
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        caption="文章列表"
        busy={busy.pending}
        empty={<Empty />}
        footer={
          total > 0 ? (
            <DataTablePager
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              total={total}
              basePath="/admin/posts"
              query={query}
              onNavigate={(href) => busy.run(() => router.push(href))}
              pending={busy.pending}
            />
          ) : undefined
        }
      />
      <GalleryModal
        isOpen={coverPreview !== null}
        onBackdropClick={handleCloseCoverPreview}
        onCloseButtonClick={handleCloseCoverPreview}
        urls={coverPreview ? [coverPreview.src] : []}
        title={coverPreview?.title}
        dialogLabel="封面预览"
        showThumbnails={false}
        themePreset={preset}
      />
    </>
  )
}
