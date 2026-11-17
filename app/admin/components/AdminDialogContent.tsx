"use client"

import type { ComponentProps } from "react"

import { DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/ui/cn"
import { useAdminTheme } from "./AdminShell"

export function AdminDialogContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
    const { preset } = useAdminTheme()

    return (
        <DialogContent
            {...props}
            aria-describedby={props["aria-describedby"]}
            className={cn("admin-shell admin-dialog-content", className)}
            data-preset={preset}
        />
    )
}
