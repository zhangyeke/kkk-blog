import type { ReactNode } from "react"

import { cn } from "@/lib/ui/cn"

/** 字段外壳：标签 + 控件 + 行内错误 */
export function FormField({
    label,
    htmlFor,
    required = false,
    error,
    hint,
    className,
    children,
}: {
    label: string
    htmlFor?: string
    required?: boolean
    error?: string
    /** 字段下方的灰字提示（如「内置角色的标识与状态不可修改」） */
    hint?: string
    className?: string
    children: ReactNode
}) {
    return (
        <div className={cn("flex min-w-0 flex-col gap-1", className)}>
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-1 text-xs md:text-sm leading-tight tracking-[0.12em]"
                style={{color: "var(--adm-ink-3)"}}
            >
                {required && (
                    <span aria-hidden style={{color: "var(--adm-c2)"}}>
                        *
                    </span>
                )}
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs md:text-sm leading-tight" style={{color: "var(--adm-c2)"}}>
                    {error}
                </p>
            )}
            {!error && hint && (
                <p className="text-xs md:text-sm leading-tight" style={{color: "var(--adm-ink-3)"}}>
                    {hint}
                </p>
            )}
        </div>
    )
}
