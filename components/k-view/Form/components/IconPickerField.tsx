"use client"

import React from "react"
import { ChevronDown } from "lucide-react"

import { AdminIcon } from "@/app/admin/components/admin-icons"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/ui/cn"
import { AdminThemeContext } from "@/components/admin/admin-theme-context"
import { DEFAULT_PRESET } from "@/lib/admin/presets"

/** 后台图标选择器，菜单和分类表单共用同一套图标字典。 */
export function IconPickerField({
    id,
    value,
    onChange,
    disabled = false,
    options,
    placeholder,
    ariaLabel,
    emptyLabel,
    columns,
}: {
    id?: string
    value: string
    onChange: (next: string) => void
    disabled?: boolean
    options: readonly string[]
    placeholder: string
    ariaLabel: string
    emptyLabel: string
    columns: number
}) {
    const [open, setOpen] = React.useState(false)
    const preset = React.useContext(AdminThemeContext)?.preset ?? DEFAULT_PRESET
    const known = value !== "" && options.includes(value)

    return (
        <div className="flex min-w-0 items-center gap-1.5">
            <Input
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="h-8 min-w-0 flex-1 text-sm md:text-base"
                autoComplete="off"
            />

            <span
                className="grid size-8 shrink-0 place-items-center rounded-md border"
                style={{
                    borderColor: "var(--adm-line)",
                    background: "var(--adm-paper-3)",
                    color: known ? "var(--adm-ink-2)" : "var(--adm-ink-3)",
                }}
                title={value === "" ? "未选择图标" : known ? `图标：${value}` : `未知图标：${value}（侧栏会画兜底图标）`}
            >
                <AdminIcon name={value} className="size-4"/>
            </span>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        aria-label={ariaLabel}
                        className={cn(
                            "grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border transition-colors",
                            "hover:bg-[var(--adm-paper-3)] disabled:cursor-not-allowed disabled:opacity-45",
                        )}
                        style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-3)"}}
                    >
                        <ChevronDown className="size-4"/>
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    align="end"
                    data-preset={preset}
                    className="admin-shell z-100 w-[252px] rounded-xl p-2"
                    style={{borderColor: "var(--adm-line)", background: "var(--adm-paper-2)"}}
                >
                    <div className="grid gap-1" style={{gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`}}>
                        <button
                            type="button"
                            onClick={() => {
                                onChange("")
                                setOpen(false)
                            }}
                            title={emptyLabel}
                            aria-label={emptyLabel}
                            className="grid size-9 cursor-pointer place-items-center rounded-md text-xs md:text-sm transition-colors hover:bg-[var(--adm-paper-3)]"
                            style={{
                                color: "var(--adm-ink-3)",
                                outline: value === "" ? "1px solid var(--adm-c1)" : "none",
                            }}
                        >
                            {emptyLabel}
                        </button>

                        {options.map((name) => {
                            const active = name === value
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => {
                                        onChange(name)
                                        setOpen(false)
                                    }}
                                    title={name}
                                    aria-label={name}
                                    aria-pressed={active}
                                    className="grid size-9 cursor-pointer place-items-center rounded-md transition-colors hover:bg-[var(--adm-paper-3)]"
                                    style={{
                                        color: active ? "var(--adm-c1)" : "var(--adm-ink-2)",
                                        background: active ? "var(--adm-paper-3)" : "transparent",
                                        outline: active ? "1px solid var(--adm-c1)" : "none",
                                    }}
                                >
                                    <AdminIcon name={name} className="size-4"/>
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
