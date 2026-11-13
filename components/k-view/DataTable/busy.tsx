"use client"

import React from "react"
import { Loader } from "lucide-react"

/**
 * 表格「忙碌」态：导航/刷新期间保留旧数据，只在上面盖一层半透明蒙层。
 *
 * 和 DataTable 的 `loading`（骨架屏）是两件事：
 * - `loading` 是首屏没有数据时的占位，语义是「还没有内容」
 * - `busy` 是已有内容、正在取新数据，语义是「内容还在，马上换」
 *
 * Provider 只负责 context（一个 useTransition），不产出任何 DOM，
 * 所以包在页面里不会改变布局。
 */

export type TableBusy = {
  /** 是否有进行中的导航/刷新 */
  pending: boolean
  /** 把一个导航动作包进 transition；无 Provider 时直接执行 */
  run: (task: () => void) => void
}

const TableBusyContext = React.createContext<TableBusy | null>(null)

export function TableBusyProvider({ children }: { children: React.ReactNode }) {
  const [pending, startTransition] = React.useTransition()

  const value = React.useMemo<TableBusy>(
    () => ({
      pending,
      run: (task) => startTransition(task),
    }),
    [pending]
  )

  return <TableBusyContext.Provider value={value}>{children}</TableBusyContext.Provider>
}

/** 没有 Provider 时返回 no-op，`components/k-view/*` 是通用层，不能假设上层一定包了 Provider */
const IDLE: TableBusy = { pending: false, run: (task) => task() }

export function useTableBusy(): TableBusy {
  return React.useContext(TableBusyContext) ?? IDLE
}

export function TableLoadingOverlay({ active, label }: { active: boolean; label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!active}
      className="pointer-events-none absolute inset-0 z-10 grid place-items-center transition-opacity duration-200"
      style={{
        opacity: active ? 1 : 0,
        background: "color-mix(in oklab, var(--adm-paper-2) 68%, transparent)",
        backdropFilter: active ? "blur(1px)" : undefined,
        // 延迟淡入，避免快速导航闪一下
        transitionDelay: active ? "140ms" : "0ms",
      }}
    >
      <div
        className="flex items-center gap-2 rounded-md px-3 py-1.5"
        style={{
          background: "var(--adm-paper)",
          border: "1px solid var(--adm-line)",
          color: "var(--adm-ink-2)",
        }}
      >
        <Loader className="size-3.5 animate-spin" />
        <span className="text-xs md:text-sm">{label ?? "加载中…"}</span>
      </div>
    </div>
  )
}
