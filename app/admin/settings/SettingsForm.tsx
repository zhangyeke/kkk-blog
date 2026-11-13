"use client"

import React from "react"

const ITEMS = [
    {key: "review", label: "评论审核", desc: "新评论需审核后展示", initial: true},
    {key: "toc", label: "文章目录", desc: "长文右侧显示大纲", initial: true},
    {key: "petals", label: "飘落花瓣", desc: "博客页面的背景动效", initial: false},
    {key: "autosave", label: "自动保存", desc: "编辑器每 30 秒保存一次", initial: true},
]

/**
 * 设置项目前只做界面，开关状态存在组件内、不落库。
 * 页脚有明确说明——不做「点了保存其实没存」的假交互。
 */
export function SettingsForm() {
    const [state, setState] = React.useState<Record<string, boolean>>(
        () => Object.fromEntries(ITEMS.map((item) => [item.key, item.initial])),
    )

    return (
        <div>
            <div className="border-b px-4 py-3" style={{borderColor: "var(--adm-line-2)"}}>
                <span className="adm-serif text-base md:text-lg" style={{color: "var(--adm-ink)"}}>偏好</span>
            </div>

            {ITEMS.map((item) => {
                const checked = state[item.key] ?? false
                return (
                    <div
                        key={item.key}
                        className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0"
                        style={{borderColor: "var(--adm-line-2)"}}
                    >
                        <div className="min-w-0">
                            <div className="text-sm md:text-base" style={{color: "var(--adm-ink)"}}>{item.label}</div>
                            <div className="mt-0.5 text-xs md:text-sm" style={{color: "var(--adm-ink-3)"}}>{item.desc}</div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            aria-label={item.label}
                            onClick={() => setState((prev) => ({...prev, [item.key]: !checked}))}
                            className="ml-auto h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full transition-colors duration-200"
                            style={{background: checked ? "var(--adm-c2)" : "var(--adm-line)"}}
                        >
                            <span
                                className="block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
                                style={{transform: `translateX(${checked ? 20 : 2}px)`}}
                            />
                        </button>
                    </div>
                )
            })}

            <p className="border-t px-4 py-3 text-xs md:text-sm leading-relaxed" style={{borderColor: "var(--adm-line-2)", color: "var(--adm-ink-3)"}}>
                这些开关尚未接入持久化，仅作界面演示。接入时把 state 换成 service 的读写即可。
            </p>
        </div>
    )
}
