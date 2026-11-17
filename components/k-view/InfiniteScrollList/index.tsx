"use client"

import React, { ReactNode, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/ui/cn"
import { addUnit } from "@/lib/number"
import { Button } from "@/components/ui/button"
import { Spinner } from "../Loader/Spinner"
import { Empty } from "../Empty"
import { Division } from "../division"

export type InfiniteScrollListInstance<T> = {
  updateItems: React.Dispatch<React.SetStateAction<T[]>>
}

export interface InfiniteScrollListProps<D> extends BaseComponentProps {
  initialData?: D[]
  apiParams?: AnyObject
  loaderMargin?: number | string
  initialPageSize?: number
  renderItem: (item: D, index: number) => ReactNode
  fetchData: <P extends Paging>(
    params: P
  ) => Promise<
    BaseResource<{
      list: D[]
      totalPages: number
      currentPage: number
    }>
  >
  enabledScrollLoad?: boolean
  ref?: React.Ref<InfiniteScrollListInstance<D>>
}

export const InfiniteScrollList = <T,>({
  ref,
  fetchData,
  renderItem,
  apiParams,
  className,
  style,
  loaderMargin = "200px",
  initialPageSize = 10,
  enabledScrollLoad = true,
  initialData = [],
}: InfiniteScrollListProps<T>) => {
  const [items, setItems] = useState(initialData)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const generation = useRef(0)
  const pendingGeneration = useRef<number | null>(null)
  const fetchRef = useRef(fetchData)
  const paramsKey = JSON.stringify(apiParams || {})
  const params = useMemo(() => JSON.parse(paramsKey) as AnyObject, [paramsKey])

  useImperativeHandle(ref, () => ({ updateItems: setItems }), [])
  useEffect(() => {
    fetchRef.current = fetchData
  }, [fetchData])

  const loadPage = useCallback(
    async (currentPage: number) => {
      const requestGeneration = generation.current
      // Lock synchronously: observer notifications can arrive before React renders loading=true.
      if (pendingGeneration.current === requestGeneration) return
      pendingGeneration.current = requestGeneration
      setLoading(true)
      setError(null)
      try {
        const response = await fetchRef.current({ ...params, page: currentPage, pageSize: initialPageSize })
        if (requestGeneration !== generation.current) return
        if (response.code !== 200) throw new Error(response.message || "加载失败")
        const { list, totalPages } = response.data
        setItems((previous) => (currentPage === 1 ? list : [...previous, ...list]))
        setHasMore(currentPage < totalPages)
        setPage(currentPage + 1)
        setLoaded(true)
      } catch (cause) {
        if (requestGeneration === generation.current) {
          setError(cause instanceof Error ? cause.message : "加载失败，请稍后重试")
          setPage(currentPage)
        }
      } finally {
        if (requestGeneration === generation.current) {
          pendingGeneration.current = null
          setLoading(false)
        }
      }
    },
    [params, initialPageSize]
  )

  useEffect(() => {
    generation.current += 1
    setItems([])
    setPage(1)
    setHasMore(true)
    setLoaded(false)
    void loadPage(1)
    // Invalidate in-flight results on a filter change or unmount.
    return () => {
      generation.current += 1
    }
  }, [loadPage])

  useEffect(() => {
    const element = sentinel.current
    if (!element || !enabledScrollLoad || loading || error || !loaded || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadPage(page)
      },
      { rootMargin: addUnit(loaderMargin), threshold: 0.1 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabledScrollLoad, loading, error, loaded, hasMore, page, loaderMargin, loadPage])

  return (
    <>
      <div className={cn(className)} style={style} aria-busy={loading}>
        {items.map(renderItem)}
      </div>
      {!loading && !error && loaded && items.length === 0 && <Empty />}
      <div ref={sentinel} className="flex-center min-h-30 flex-col py-10" aria-live="polite">
        {loading && <Spinner text="加载中" />}
        {error && (
          <div className="flex flex-col items-center gap-2 text-red-500" role="alert">
            <p>{error}</p>
            <Button onClick={() => void loadPage(page)}>点此重试</Button>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <Division>
            <span className="mx-2">🧩 已经没有更多碎片啦</span>
          </Division>
        )}
      </div>
    </>
  )
}
