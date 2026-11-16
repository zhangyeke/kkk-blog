/**
 * 分页归一化。
 *
 * 为什么单独放在 lib/ 而不是 server action 模块：
 * `"use server"` 文件只能导出 async 函数，同步工具函数放在那里会导致
 * 「Server Actions must be async functions」构建报错。所以抽到这里，
 * 让 server action 与其它同步逻辑都能复用。
 */

export type Paging = { page: number; pageSize: number }

export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 300, 500] as const

/** Accept only the page sizes exposed by the admin table pager. */
export function normalizePageSize(value?: number | string | null): number {
    const pageSize = typeof value === "number" ? value : Number(value)
    return PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number])
        ? pageSize
        : DEFAULT_PAGE_SIZE
}

/**
 * 归一化分页参数。
 *
 * - page ≥ 1
 * - pageSize 1..500，默认 10
 *
 * 非法值（负数 / 0 / 非整数）一律夹到合法区间，避免 skip / take 传负数报错。
 */
export function normalizePaging(paging?: Partial<Paging>): Paging {
    const page = Math.max(1, Math.floor(paging?.page ?? 1))
    const pageSize = Math.min(500, Math.max(1, Math.floor(paging?.pageSize ?? DEFAULT_PAGE_SIZE)))
    return { page, pageSize }
}
