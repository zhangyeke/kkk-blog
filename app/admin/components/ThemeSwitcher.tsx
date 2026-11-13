"use client"

import React from "react"
import { Check, Palette } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { ADMIN_PRESETS } from "@/lib/admin-presets"
import { useAdminTheme } from "./AdminShell"

export function ThemeSwitcher() {
    const {preset, setPreset} = useAdminTheme()
    const [open, setOpen] = React.useState(false)
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const reduce = useReducedMotion()

    React.useEffect(() => {
        if (!open) return
        const onPointerDown = (event: PointerEvent) => {
            if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", onPointerDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onPointerDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    return (
        <div ref={wrapRef} className="relative">
            <button
                type="button"
                aria-label="切换主题风格"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="grid size-9 cursor-pointer place-items-center rounded-lg border transition-colors hover:bg-[var(--adm-paper-3)]"
                style={{borderColor: "var(--adm-line)", color: "var(--adm-ink-2)"}}
            >
                <Palette className="size-4"/>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-label="主题风格"
                        initial={reduce ? {opacity: 0} : {opacity: 0, scale: 0.94, y: -6}}
                        animate={reduce ? {opacity: 1} : {opacity: 1, scale: 1, y: 0}}
                        exit={reduce ? {opacity: 0} : {opacity: 0, scale: 0.96, y: -4}}
                        transition={
                            reduce
                                ? {duration: 0.12}
                                : {type: "spring", stiffness: 420, damping: 32, mass: 0.7}
                        }
                        className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(268px,calc(100vw-1.5rem))] origin-top-right rounded-xl border p-2 shadow-xl"
                        style={{
                            background: "var(--adm-paper-2)",
                            borderColor: "var(--adm-line)",
                        }}
                    >
                        <p
                            className="px-2 pb-2 pt-1 text-xs md:text-sm tracking-[0.18em]"
                            style={{color: "var(--adm-ink-3)"}}
                        >
                            主题风格 · 9 套
                        </p>

                        <div className="grid grid-cols-3 gap-1">
                            {ADMIN_PRESETS.map((item) => {
                                const active = item.id === preset
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setPreset(item.id)
                                            setOpen(false)
                                        }}
                                        aria-pressed={active}
                                        className="relative flex cursor-pointer flex-col items-start gap-1.5 rounded-lg px-2 py-2 text-left transition-colors"
                                        style={{
                                            background: active ? "var(--adm-paper-3)" : "transparent",
                                        }}
                                    >
                                        <span className="flex gap-1">
                                            {item.dots.map((color) => (
                                                <i
                                                    key={color}
                                                    className="size-2.5 rounded-[3px] ring-1 ring-black/10"
                                                    style={{background: color}}
                                                />
                                            ))}
                                        </span>
                                        <span
                                            className="text-xs md:text-sm leading-none"
                                            style={{
                                                color: active ? "var(--adm-ink)" : "var(--adm-ink-2)",
                                            }}
                                        >
                                            {item.label}
                                        </span>
                                        {active && (
                                            <Check
                                                className="absolute right-1.5 top-1.5 size-3"
                                                style={{color: "var(--adm-c2)"}}
                                            />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
