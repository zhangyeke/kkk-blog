"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as React from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * 确认弹窗（shadcn 官方结构 + 后台「文库本」令牌）。
 *
 * 为什么不用 window.confirm：原生弹窗的按钮文案、层级、配色全都不可控，
 * 在纸墨风格的后台里会突然弹出一块浏览器灰，而且无法用键盘/自动化精确定位。
 *
 * 主题作用域：Radix 的 Portal 会把内容挂到 body 上，`.admin-shell` 之外的
 * `var(--adm-*)` 全部解析失败（表现为背景透明、文字变黑）。
 * 这里在 AlertDialogContent 上直接带 `admin-shell` 类把变量补齐——
 * 通用层不 import 后台的 useAdminTheme，调用方想精确到预设时自行透传
 * `data-preset`（属性会原样落到内容节点上）。
 */

function AlertDialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
    return (
        <DialogPrimitive.Overlay
            data-slot="alert-dialog-overlay"
            className={cn(
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
                className,
            )}
            {...props}
        />
    )
}

function AlertDialogContent({
    className,
    style,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
    return (
        <AlertDialogPortal>
            <AlertDialogOverlay />
            <DialogPrimitive.Content
                data-slot="alert-dialog-content"
                className={cn(
                    "admin-shell data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-[calc(100%-2rem)] max-w-[420px] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border p-6 shadow-lg duration-200",
                    className,
                )}
                // 内联令牌：即使没有后台样式表，也不会退化成透明底
                style={{ background: "var(--adm-paper-2)", borderColor: "var(--adm-line)", ...style }}
                onEscapeKeyDown={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                {...props}
            />
        </AlertDialogPortal>
    )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-header"
            className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
            {...props}
        />
    )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="alert-dialog-footer"
            className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
            {...props}
        />
    )
}

function AlertDialogTitle({ className, style, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="alert-dialog-title"
            className={cn("adm-serif text-[16px] leading-[24px]", className)}
            style={{ color: "var(--adm-ink)", ...style }}
            {...props}
        />
    )
}

function AlertDialogDescription({
    className,
    style,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="alert-dialog-description"
            className={cn("text-[13px] leading-[20px]", className)}
            style={{ color: "var(--adm-ink-3)", ...style }}
            {...props}
        />
    )
}

function AlertDialogAction({
    className,
    style,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return (
        <DialogPrimitive.Close
            data-slot="alert-dialog-action"
            className={cn(
                buttonVariants(),
                // 危险操作：主题强调色填充，与分类/角色页的删除按钮同一套语言
                "h-8 cursor-pointer rounded-md px-4 text-[13px]",
                "bg-[var(--adm-c2)] text-[var(--adm-paper-2)] hover:bg-[var(--adm-c2)] hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-45",
                className,
            )}
            style={style}
            {...props}
        />
    )
}

function AlertDialogCancel({
    className,
    style,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return (
        <DialogPrimitive.Close
            data-slot="alert-dialog-cancel"
            className={cn(
                // ghost 打底：它不带底色，深色模式下也不会突然盖一层 input 色
                buttonVariants({ variant: "ghost" }),
                "h-8 cursor-pointer rounded-md border px-4 text-[13px]",
                "border-[var(--adm-line)] bg-transparent text-[var(--adm-ink-2)]",
                "hover:bg-[var(--adm-paper-3)] hover:text-[var(--adm-ink)]",
                "disabled:cursor-not-allowed disabled:opacity-45",
                className,
            )}
            style={style}
            {...props}
        />
    )
}

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogTitle,
    AlertDialogTrigger,
}
