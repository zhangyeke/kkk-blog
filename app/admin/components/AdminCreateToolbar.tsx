"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { MouseEvent, ReactNode } from "react"

import { useAdminTheme } from "@/app/admin/components/AdminShell"
import { ToolbarActionButton } from "@/app/admin/components/ToolbarActionButton"
import { type PermissionAction, usePermission } from "@/components/admin/permission-context"
import { type RenderDialogOptions, useRenderDialog } from "@/components/k-view/Popup/useRenderDialog"

type DialogConfig = Pick<
  RenderDialogOptions,
  "headerClassName" | "titleClassName" | "contentClassName" | "contentProps"
>

export type AdminCreateDialogControls = {
  close: () => void
  onCancel: () => void
  onSuccess: () => void
}

export type AdminCreateToolbarProps = {
  permission: PermissionAction
  buttonLabel: ReactNode
  dialogTitle: ReactNode
  renderForm: (controls: AdminCreateDialogControls) => ReactNode
  dialog?: DialogConfig
  disabled?: boolean
  testId?: string
}

/** Shared create action: permission gate, themed trigger, dialog shell, and refresh-on-success. */
export function AdminCreateToolbar({
  permission,
  buttonLabel,
  dialogTitle,
  renderForm,
  dialog,
  disabled = false,
  testId,
}: AdminCreateToolbarProps) {
  const { can } = usePermission()
  const { openDialog } = useRenderDialog()
  const { preset } = useAdminTheme()
  const router = useRouter()

  function handleCreateClick(event: MouseEvent<HTMLButtonElement>) {
    openDialog(
      {
        headerClassName: dialog?.headerClassName ?? "shrink-0 border-[var(--adm-line)] px-5 text-left",
        titleClassName: dialog?.titleClassName ?? "adm-serif text-base md:text-lg text-[var(--adm-ink)]",
        contentClassName: dialog?.contentClassName ?? "admin-shell admin-dialog-content",
        contentProps: {
          ...dialog?.contentProps,
          showCloseButton: false,
          "data-preset": preset,
        },
        title: dialogTitle,
        render: ({ close, onCancel }) =>
          renderForm({
            close,
            onCancel,
            onSuccess: () => {
              close()
              router.refresh()
            },
          }),
      },
      event.currentTarget,
    )
  }

  if (!can(permission)) return null

  return (
    <ToolbarActionButton onClick={handleCreateClick} disabled={disabled} data-testid={testId}>
      <Plus className="size-4" aria-hidden="true" />
      {buttonLabel}
    </ToolbarActionButton>
  )
}
