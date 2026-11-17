import React from "react"

import { RefreshButton } from "@/components/k-view/RefreshButton"
import { cn } from "@/lib/ui/cn"

/** 表格上方的工具条：左侧主操作、右侧刷新。 */
export function TableToolbar({ action, className }: { action?: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {action}
            <RefreshButton className="ml-auto"/>
        </div>
    )
}

