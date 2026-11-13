"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTableBusy } from "../DataTable/busy"

/**
 * 刷新按钮：调 router.refresh() 让服务端组件重新取数，
 * 客户端组件状态与滚动位置都保留，比整页 reload 体验好得多。
 *
 * 用 useTransition 拿 pending 状态驱动图标旋转——旋转动画本身就是"正在刷新"的反馈。
 * 若外层包了 TableBusyProvider，刷新同时会驱动表格上的蒙层（busy.pending）。
 */
export function RefreshButton({ className }: { className?: string }) {
    const router = useRouter()
    const busy = useTableBusy()
    const [localPending, startTransition] = React.useTransition()

    // 有 Provider 时两者同时为真；无 Provider 时靠本地 transition 让图标照样转
    const pending = busy.pending || localPending

    const doRefresh = () => {
        startTransition(() => {
            busy.run(() => router.refresh())
        })
    }

    return (
        <button
            type="button"
            aria-label="刷新"
            title="刷新"
            disabled={pending}
            onClick={doRefresh}
            className={cn(
                "grid size-8 cursor-pointer place-items-center rounded-md border transition-colors",
                "hover:bg-[var(--adm-paper-3)] disabled:cursor-not-allowed disabled:opacity-60",
                className,
            )}
            style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
        >
            <RefreshCw className={cn("size-3.5 transition-transform", pending && "animate-spin")}/>
        </button>
    )
}
