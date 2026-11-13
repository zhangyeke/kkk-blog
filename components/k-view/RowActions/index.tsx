"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import type { AdminAction } from "@/lib/permissions"
import { cn } from "@/lib/utils"

/**
 * 表格行操作列。
 *
 * 常规的「编辑 / 删除」通过 kind 直接给图标、确认文案和权限，
 * 调用方只传 href / onClick，不用每次都重复写图标和 confirm 逻辑；
 * 特殊操作走 kind: "custom" 自定义。
 *
 * 权限判定通过 `can` 注入而不是内部读 context——这样这个组件放在 k-view 里
 * 不依赖后台的权限体系，别处也能用。
 *
 * 删除确认走 shadcn 的 AlertDialog 而不是 window.confirm：
 * 原生弹窗样式不可控、在纸墨主题里格格不入，也没法被自动化测试精确定位。
 * 对外 API 未变——调用方仍然只传 confirmText / onClick。
 *
 * custom 动作传了 confirmText 也会走同一个确认框（下架这类有副作用的操作用得上），
 * 不传则直接执行。
 */

export type RowActionItem = {
    key: string
    kind?: "edit" | "delete" | "custom"
    label: string
    /** edit 用 href 跳转 */
    href?: string
    /** delete / custom 用回调 */
    onClick?: () => void | Promise<unknown>
    /** 二次确认文案。delete 不传也会用默认文案弹窗；custom 传了才弹 */
    confirmText?: string
    /** 确认弹窗标题；delete 默认「确认删除」，其它默认「确认操作」 */
    confirmTitle?: string
    /** 确认按钮文案；delete 默认「删除」，其它默认「确定」 */
    confirmLabel?: string
    /** 需要哪个动作权限；不传则不做权限过滤 */
    permission?: AdminAction
    /** 视觉语气，delete 默认 danger */
    tone?: "default" | "danger"
    /** 自定义图标，覆盖 kind 的默认图标 */
    icon?: React.ReactNode
}

export type RowActionsProps = {
    actions: RowActionItem[]
    /** 权限判定，通常传 usePermission().can */
    can?: (permission: AdminAction) => boolean
    className?: string
}

const BASE = "size-7 shrink-0"

const DEFAULT_DELETE_TEXT = (label: string) => `确定删除「${label}」？此操作不可撤销。`

export function RowActions({actions, can, className}: RowActionsProps) {
    const router = useRouter()
    const [pendingKey, setPendingKey] = React.useState<string | null>(null)
    // 非 null 即「有一个动作在等用户确认」
    const [pendingConfirm, setPendingConfirm] = React.useState<RowActionItem | null>(null)

    const allowed = actions.filter((item) => {
        if (!item.permission || !can) return true
        return can(item.permission)
    })

    /** 真正执行动作：转圈 → 回调 → 刷新列表 */
    const run = React.useCallback(
        async (item: RowActionItem) => {
            if (!item.onClick) return
            setPendingKey(item.key)
            try {
                await item.onClick()
                router.refresh()
            } finally {
                setPendingKey(null)
            }
        },
        [router],
    )

    const handle = React.useCallback(
        (item: RowActionItem) => {
            // 删除恒弹确认框；custom 只有显式给了 confirmText 才弹（发布这类可逆操作直接执行）
            if (item.kind === "delete" || item.confirmText) {
                setPendingConfirm(item)
                return
            }
            void run(item)
        },
        [run],
    )

    const handleConfirm = React.useCallback(() => {
        const item = pendingConfirm
        setPendingConfirm(null)
        if (item) void run(item)
    }, [pendingConfirm, run])

    if (allowed.length === 0) return null

    // 文案按 kind 回落：delete 保留原来的默认措辞，其它动作取调用方给的文案
    const isDeleteConfirm = pendingConfirm?.kind === "delete"
    const confirmTitle = pendingConfirm?.confirmTitle ?? (isDeleteConfirm ? "确认删除" : "确认操作")
    const confirmText =
        pendingConfirm?.confirmText ??
        (isDeleteConfirm ? DEFAULT_DELETE_TEXT(pendingConfirm?.label ?? "") : (pendingConfirm?.label ?? ""))
    const confirmLabel = pendingConfirm?.confirmLabel ?? (isDeleteConfirm ? "删除" : "确定")

    return (
        <>
            <div className={cn("flex items-center justify-end gap-1", className)}>
                {allowed.map((item) => {
                    const isDelete = item.kind === "delete"
                    const tone = item.tone ?? (isDelete ? "danger" : "default")
                    const icon =
                        item.icon ??
                        (item.kind === "edit" ? <Pencil className="size-3.5"/> : isDelete ? <Trash2 className="size-3.5"/> : null)

                    const shared = {
                        title: item.label,
                        "aria-label": item.label,
                        className: cn(
                            BASE,
                            tone === "danger"
                                ? "text-[var(--adm-ink-3)] hover:text-red-500"
                                : "text-[var(--adm-ink-3)] hover:text-[var(--adm-ink)]",
                        ),
                    }

                    if (item.kind === "edit" && item.href) {
                        // 用 buttonVariants 而不是 asChild：服务端传下来的 children 会被包成数组，
                        // Radix Slot 只接受单个元素，会抛 Children.only
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                {...shared}
                                className={cn(
                                    buttonVariants({variant: "ghost", size: "icon"}),
                                    shared.className,
                                )}
                            >
                                {icon}
                            </Link>
                        )
                    }

                    return (
                        <Button
                            key={item.key}
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handle(item)}
                            disabled={pendingKey === item.key}
                            {...shared}
                        >
                            {icon ?? <span className="text-[12px]">{item.label}</span>}
                        </Button>
                    )
                })}
            </div>

            <AlertDialog
                open={pendingConfirm !== null}
                onOpenChange={(next) => {
                    if (!next) setPendingConfirm(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmText}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingConfirm(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            disabled={pendingConfirm !== null && pendingKey === pendingConfirm.key}
                        >
                            {confirmLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
