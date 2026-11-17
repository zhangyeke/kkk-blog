"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/ui/cn"
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/paging"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {CopyText, type CopyTextProps} from "../Text/CopyText"
import { Empty } from "../Empty"
import { FixSpin } from "../Loader"
import { fixedCellStyle, type FixedSide, observeFixedColumns } from "./fixed-columns"

/**
 * 通用表格。
 *
 * 设计取舍：
 * - 只吃列配置 + 数据，不碰取数逻辑，服务端/客户端都能用
 * - 表格语义结构复用 shadcn/ui 的 Table primitives，行为由 DataTable 管理
 * - 颜色走站点的语义 token（border-border / text-muted-foreground …），
 *   后台主题只要覆盖这些 token 就能整体换肤，组件本身不需要知道主题的存在
 * - 行操作默认隐藏，hover / focus 才出现，避免每行挂三个按钮把表格搞乱
 * - 分页做成独立的 DataTablePager（页码使用 Link，每页条数通过 URL 参数控制）
 */

export type DataTableColumn<T> = {
    key: string
    title: React.ReactNode
    /** 列宽，如 "44%" / "120px" */
    width?: string
    align?: "left" | "center" | "right"
    /** 自定义单元格内容；省略时直接显示对应的 row[key] */
    render?: (row: T, index: number) => React.ReactNode
    /** 为单元格文本添加复制按钮；对象参数透传给 CopyText（text / children 由表格提供） */
    copy?: boolean | Omit<CopyTextProps, "text" | "children">
    className?: string
    /** 小屏隐藏该列 */
    hideOnMobile?: boolean
    /** 横向滚动时固定列。true 等同 left，false 关闭默认固定。 */
    fixed?: boolean | FixedSide
    /** 兼容已有调用，新的列配置使用 fixed。 */
    pin?: FixedSide
}

export type DataTableProps<T> = {
    columns: DataTableColumn<T>[]
    rows: readonly T[]
    rowKey: (row: T) => React.Key
    /** 行尾操作区，hover 时淡入 */
    actions?: (row: T) => React.ReactNode
    /** 首屏无数据时的骨架屏 */
    loading?: boolean
    /**
     * 已有数据、正在取新数据（翻页 / 筛选 / 刷新）。
     * 和 `loading` 语义不同：`loading` 替换表格内容，`busy` 保留旧内容并盖一层蒙层。
     */
    busy?: boolean
    /** 空态，默认给一句中性文案 */
    empty?: React.ReactNode
    onRowClick?: (row: T) => void
    /** 紧凑行高 */
    dense?: boolean
    /** 表格下方的附加区域（如分页） */
    footer?: React.ReactNode
    /** 骨架行数 */
    skeletonRows?: number
    /** 给读屏用的表格说明 */
    caption?: string
    className?: string
    /** 表格滚动容器的附加样式；默认仅限制横向溢出。 */
    scrollClassName?: string
}

const ALIGN: Record<NonNullable<DataTableColumn<unknown>["align"]>, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
}

function getNodeText(node: React.ReactNode): string {
    if (node === null || node === undefined || typeof node === "boolean") return ""
    if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node)
    if (Array.isArray(node)) return node.map((child) => getNodeText(child as React.ReactNode)).join("")
    if (React.isValidElement<{children?: React.ReactNode}>(node)) return getNodeText(node.props.children)
    return ""
}

export function DataTable<T>({
    columns,
    rows,
    rowKey,
    actions,
    loading = false,
    busy = false,
    empty,
    onRowClick,
    dense = false,
    footer,
    skeletonRows = 5,
    caption,
    className,
    scrollClassName,
}: DataTableProps<T>) {
    const cellPad = dense ? "px-4 py-1.5" : "px-4 py-2"

    const scrollRef = React.useRef<HTMLDivElement>(null)
    const configured = columns.map((column) => ({
        ...column,
        side: column.fixed === true ? "left" as const : column.fixed ?? column.pin,
    }))
    const leftColumns = configured.filter((column) => column.side === "left")
    const rightColumns = configured.filter((column) => column.side === "right")
    const orderedColumns = [
        ...leftColumns,
        ...configured.filter((column) => column.side !== "left" && column.side !== "right"),
        ...rightColumns,
    ]
    const firstDesktop = orderedColumns[0]
    const firstMobile = orderedColumns.find((column) => !column.hideOnMobile)
    const defaultDesktop = leftColumns.length === 0 && firstDesktop?.side === undefined && firstDesktop?.width?.endsWith("px")
        ? firstDesktop.key
        : undefined
    const defaultMobile = !leftColumns.some((column) => !column.hideOnMobile) && firstMobile?.side === undefined
        ? firstMobile?.key
        : undefined
    const cellPins = orderedColumns.map((column) => {
        const side = column.side || undefined
        return {
            desktop: side ?? (column.key === defaultDesktop ? "left" as const : undefined),
            mobile: column.hideOnMobile ? undefined : side ?? (column.key === defaultMobile ? "left" as const : undefined),
        }
    })
    const actionIndex = orderedColumns.length
    const hasActions = Boolean(actions)
    const pinLayout = JSON.stringify(orderedColumns.map(({ key }, index) => [key, cellPins[index]]))

    React.useEffect(() => {
        if (scrollRef.current) return observeFixedColumns(scrollRef.current)
    }, [pinLayout, hasActions])

    function pinnedStyle(index: number, header = false) {
        const pin = cellPins[index]
        return pin?.desktop || pin?.mobile ? fixedCellStyle(index, header) : undefined
    }

    return (
        <div className={cn("relative overflow-hidden rounded-lg border border-border bg-card", className)}>
            {/* overscroll-x-contain：触屏上横滑到头不要触发浏览器的前进/后退手势 */}
            <Table
                containerRef={scrollRef}
                containerClassName={cn("overscroll-x-contain", scrollClassName)}
                containerProps={{
                    role: "region",
                    tabIndex: 0,
                    "aria-label": caption ?? "可横向滚动的数据表格",
                }}
                className="border-separate border-spacing-0 [&_tbody_tr:not(:last-child)>td]:border-b [&_tbody_tr:not(:last-child)>td]:border-border/60"
            >
                {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
                <TableHeader className="bg-card">
                    <TableRow className="bg-card border-0 hover:bg-transparent">
                        {orderedColumns.map((col, columnIndex) => {
                            const pin = cellPins[columnIndex]
                            return (
                                <TableHead
                                    key={col.key}
                                    scope="col"
                                    style={{ width: col.width, ...pinnedStyle(columnIndex, true) }}
                                    data-fixed-index={pin?.desktop || pin?.mobile ? columnIndex : undefined}
                                    data-fixed-desktop={pin?.desktop}
                                    data-fixed-mobile={pin?.mobile}
                                    className={cn(
                                        "h-auto border-b border-border px-4 py-2 text-xs md:text-sm font-normal tracking-[0.12em] text-muted-foreground",
                                        ALIGN[col.align ?? "left"],
                                        col.hideOnMobile && "hidden md:table-cell",
                                    )}
                                >
                                    {col.title}
                                </TableHead>
                            )
                        })}
                        {actions && (
                            <TableHead
                                key="__datatable_row_actions_header__"
                                scope="col"
                                data-fixed-index={actionIndex}
                                data-fixed-desktop="right"
                                data-fixed-mobile="right"
                                style={fixedCellStyle(actionIndex, true)}
                                className="h-auto border-b border-border px-4 py-2"
                            >
                                <span className="sr-only">操作</span>
                            </TableHead>
                        )}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading &&
                        Array.from({length: skeletonRows}).map((_, i) => (
                            <TableRow key={`sk-${i}`} className="border-border/60 bg-card last:border-0 hover:bg-card">
                                {orderedColumns.map((col, columnIndex) => {
                                    return (
                                        <TableCell
                                            key={col.key}
                                            style={pinnedStyle(columnIndex)}
                                            className={cn(
                                                cellPad,
                                                "whitespace-normal",
                                                col.hideOnMobile && "hidden md:table-cell",
                                            )}
                                        >
                                            <div className="h-3 w-full max-w-[220px] animate-pulse rounded bg-muted"/>
                                        </TableCell>
                                    )
                                })}
                                {actions && (
                                    <TableCell
                                        key="__datatable_skeleton_actions__"
                                        className={cellPad}
                                        style={fixedCellStyle(actionIndex)}
                                    />
                                )}
                            </TableRow>
                        ))}

                    {!loading &&
                        rows.map((row, index) => (
                            <TableRow
                                key={rowKey(row)}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(
                                    "group border-b border-border/60 transition-colors last:border-0",
                                    // 行底色要显式给：固定单元格用 background: inherit 继承它，
                                    // 这样滚动内容不会从冻结列底下透出来
                                    "bg-card hover:bg-[color-mix(in_srgb,var(--accent)_60%,var(--card))]",
                                    onRowClick && "cursor-pointer",
                                )}
                            >
                                {orderedColumns.map((col, columnIndex) => {
                                    return (
                                        <TableCell
                                            key={col.key}
                                            style={pinnedStyle(columnIndex)}
                                            className={cn(
                                                cellPad,
                                                "whitespace-normal",
                                                "text-base md:text-lg",
                                                ALIGN[col.align ?? "left"],
                                                col.hideOnMobile && "hidden md:table-cell",
                                                col.className,
                                            )}
                                        >
                                            {(() => {
                                                const rawValue = (row as Record<string, unknown>)[col.key]
                                                const content = col.render ? col.render(row, index) : String(rawValue ?? "")
                                                if (!col.copy) return content

                                                const copyProps: Omit<CopyTextProps, "text" | "children"> = col.copy === true ? {} : col.copy
                                                const text = getNodeText(content) || getNodeText(rawValue as React.ReactNode)
                                                if (!text) return content

                                                return (
                                                    <CopyText
                                                        {...copyProps}
                                                        text={text}
                                                        showIcon={copyProps.showIcon ?? true}
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            copyProps.onClick?.(event)
                                                        }}
                                                    >
                                                        {content}
                                                    </CopyText>
                                                )
                                            })()}
                                        </TableCell>
                                    )
                                })}
                                {actions && (
                                    <TableCell
                                        key={`__datatable_row_actions__${String(rowKey(row))}`}
                                        className={cellPad}
                                        style={fixedCellStyle(actionIndex)}
                                    >
                                        <div
                                            className={cn(
                                                "flex items-center justify-end gap-1",
                                                "transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:opacity-0",
                                                "group-hover:opacity-100 group-focus-within:opacity-100",
                                                "motion-reduce:opacity-100",
                                            )}
                                        >
                                            {actions(row)}
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                </TableBody>
            </Table>

            {!loading && rows.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                    {empty ?? <Empty type="data" text="还没有数据"/>}
                </div>
            )}

            {footer != null && (
                <React.Fragment key="datatable-footer">
                    {footer}
                </React.Fragment>
            )}

            { busy && <FixSpin />}
        </div>
    )
}

/**
 * 基于 Link 的分页：服务端组件友好，切页走真实导航，不需要把整张表变成客户端组件。
 *
 * 入参刻意做成可序列化的（basePath + query 对象）而不是 hrefFor 函数——
 * 服务端组件不能把函数当 prop 传给客户端组件，否则会报序列化错误。
 */
export function DataTablePager({
    page,
    totalPages,
    total,
    basePath,
    query,
    pageParam = "page",
    pageSize,
    pageSizeParam = "pageSize",
    pageSizeOptions = PAGE_SIZE_OPTIONS,
    onNavigate,
    pending = false,
    className,
}: {
    page: number
    totalPages: number
    total: number
    basePath: string
    /** 除页码外的其他查询参数，如 { status: "1" } */
    query?: Record<string, string | number | undefined>
    pageParam?: string
    /** 传入时显示每页条数选择器；用于真实分页的数据列表。 */
    pageSize?: number
    pageSizeParam?: string
    pageSizeOptions?: readonly number[]
    /** 拦截普通左键点击，交给上层包进 transition；不传则完全是原生 Link 行为 */
    onNavigate?: (href: string) => void
    /** 导航进行中：分页按钮变淡且不可点，防止连点跳多页 */
    pending?: boolean
    className?: string
}) {
    const router = useRouter()
    const pages = buildPageWindow(page, totalPages)

    const hrefFor = (target: number, targetPageSize = pageSize) => {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(query ?? {})) {
            if (key === pageParam || key === pageSizeParam) continue
            if (value !== undefined && value !== "") params.set(key, String(value))
        }
        if (target > 1) params.set(pageParam, String(target))
        if (targetPageSize !== undefined && targetPageSize !== DEFAULT_PAGE_SIZE) {
            params.set(pageSizeParam, String(targetPageSize))
        }
        const qs = params.toString()
        return qs ? `${basePath}?${qs}` : basePath
    }

    function handlePageSizeChange(value: string) {
        const nextPageSize = Number(value)
        if (pageSize === undefined || !pageSizeOptions.includes(nextPageSize) || nextPageSize === pageSize) return

        const href = hrefFor(1, nextPageSize)
        if (onNavigate) onNavigate(href)
        else router.push(href, { scroll: false })
    }

    return (
        <nav
            aria-label="分页"
            className={cn(
                "flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-2.5",
                className,
            )}
        >
            <div className="mr-auto flex min-w-0 items-center gap-2">
                <span className="whitespace-nowrap text-xs md:text-sm tabular-nums text-muted-foreground">
                    第 {page} / {totalPages} 页 · 共 {total} 条
                </span>
                {pageSize !== undefined && (
                    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground md:text-sm">
                        <span className="hidden sm:inline">每页</span>
                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange} disabled={pending}>
                            <SelectTrigger aria-label="每页显示条数" size="sm" className="h-7 w-[4.5rem] px-2 text-xs md:text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                {pageSizeOptions.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="hidden sm:inline">条/页</span>
                    </div>
                )}
            </div>

            <PagerLink
                href={hrefFor(Math.max(1, page - 1))}
                disabled={page <= 1}
                label="上一页"
                onNavigate={onNavigate}
                pending={pending}
            >
                ‹
            </PagerLink>

            {pages.map((p, i) =>
                p === "…" ? (
                    <span key={`gap-${i}`} className="px-1 text-xs md:text-sm text-muted-foreground">
                        …
                    </span>
                ) : (
                    <PagerLink
                        key={p}
                        href={hrefFor(p)}
                        active={p === page}
                        label={`第 ${p} 页`}
                        onNavigate={onNavigate}
                        pending={pending}
                    >
                        {p}
                    </PagerLink>
                ),
            )}

            <PagerLink
                href={hrefFor(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                label="下一页"
                onNavigate={onNavigate}
                pending={pending}
            >
                ›
            </PagerLink>
        </nav>
    )
}

function PagerLink({
    href,
    children,
    active = false,
    disabled = false,
    label,
    onNavigate,
    pending = false,
}: {
    href: string
    children: React.ReactNode
    active?: boolean
    disabled?: boolean
    label: string
    onNavigate?: (href: string) => void
    pending?: boolean
}) {
    const base =
        "grid h-7 min-w-7 place-items-center rounded-md border px-2 text-xs md:text-sm transition-colors"

    if (disabled) {
        return (
            <span aria-disabled className={cn(base, "border-border text-muted-foreground/40")}>
                {children}
            </span>
        )
    }

    return (
        <Link
            href={href}
            data-slot="data-table-page"
            aria-label={label}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
                if (!onNavigate) return
                // 修饰键 / 非左键点击（新标签页、新窗口）走浏览器默认行为，不拦截
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
                event.preventDefault()
                onNavigate(href)
            }}
            className={cn(
                base,
                active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                // 导航进行中禁用点击，防止连点跳多页
                onNavigate && pending && "pointer-events-none opacity-60",
            )}
        >
            {children}
        </Link>
    )
}

/** 页码窗口：1 … 4 5 [6] 7 8 … 20 */
function buildPageWindow(current: number, totalPages: number): Array<number | "…"> {
    if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1)

    const pages: Array<number | "…"> = [1]
    const start = Math.max(2, current - 1)
    const end = Math.min(totalPages - 1, current + 1)

    if (start > 2) pages.push("…")
    for (let p = start; p <= end; p++) pages.push(p)
    if (end < totalPages - 1) pages.push("…")
    pages.push(totalPages)

    return pages
}
