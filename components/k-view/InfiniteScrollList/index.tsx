"use client"
import React, { ReactNode, Ref, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { useAsyncFn, useIntersection } from "react-use";
import { addUnit, cn } from "@/lib/utils";
import { AlertCircle, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "../Loader/Spinner";
import { Empty } from "../Empty";
import { Division } from "../division";

export type InfiniteScrollListInstance<T> = {
    updateItems: React.Dispatch<React.SetStateAction<T[]>>
}

export interface InfiniteScrollListProps<D,> extends BaseComponentProps {
    initialData?: D[]
    apiParams?: AnyObject
    loaderMargin?: number | string // 离底部还有x距离进行更多加载
    initialPageSize?: number
    renderItem: (item: D, index: number) => ReactNode;
    fetchData: <P extends Paging>(params: P) => Promise<BaseResource<{
        list: D[],
        totalPages: number,
        currentPage: number,
    }>>
    enabledScrollLoad?: boolean; // 是否启用无限滚动
    ref?: React.Ref<InfiniteScrollListInstance<D>>
}

/**
 * 封装的无限滚动列表组件
 */
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
    initialData = []
}: InfiniteScrollListProps<T>) => {
    /*是否完成了一次加载*/
    const isCompleteFirstLoad = useRef(false)
    const [items, setItems] = useState<T[]>(initialData);
    const [paging, setPaging] = useState({
        page: 1,
        pageSize: initialPageSize
    });
    const [hasMore, setHasMore] = useState(true);

    // 引用处理
    const intersectionRef = useRef<HTMLDivElement>(null);
    const intersection = useIntersection(intersectionRef as React.RefObject<HTMLElement>, {
        root: null,
        rootMargin: addUnit(loaderMargin),
        threshold: 0.1,
    });

    // 1. 深度比较参数内容
    const paramsStr = JSON.stringify(apiParams || {});
    const memoParams = useMemo(() => (apiParams || {}), [paramsStr]);
    // 使用 useRef 保存最新的 fetchData 引用，避免其变化导致 useAsyncFn 重新生成
    const fetchDataRef = useRef(fetchData);

    // 2. 核心加载函数
    const [state, loadMore] = useAsyncFn(async (currentPage: number, size: number, params: AnyObject) => {
        // 守卫：非第一页且无更多，或加载中
        if (currentPage !== 1 && !hasMore || !enabledScrollLoad) return;

        try {
            // 始终使用最新的 fetchData
            const response = await fetchDataRef.current({
                page: currentPage,
                pageSize: size,
                ...params
            });
            isCompleteFirstLoad.current = true
            const { list: newItems, totalPages } = response.data;

            if (currentPage === 1) {
                setItems(newItems);
            } else {
                setItems((prev) => [...prev, ...newItems]);
            }

            const nextHasMore = currentPage < totalPages;
            setHasMore(nextHasMore);

            if (nextHasMore) {
                setPaging((prev) => ({ ...prev, page: currentPage + 1 }));
            }

            return response;
        } catch (error) {
            throw error;
        }
    }, [hasMore, enabledScrollLoad]); // 删除了 fetchData 依赖，改用 Ref 访问

    useImperativeHandle(ref, () => ({
        updateItems: setItems
    }))


    useEffect(() => {
        fetchDataRef.current = fetchData;
    }, [fetchData]);


    // 3. 仅在参数内容 (paramsStr) 变化时执行重置
    // 核心修复：这个 Effect 不再依赖 loadMore 引用，只依赖内容字符串
    useEffect(() => {
        // 只有在非初始化（或者参数真的变了）时才重置
        setHasMore(true);
        setPaging({ page: 1, pageSize: initialPageSize });

        // 触发第一页
        loadMore(1, initialPageSize, memoParams);

        // 注意：不要把 loadMore 放在这里，或者确保它是不变的
    }, [paramsStr, initialPageSize]);


    // 4. 处理滚动触发
    useEffect(() => {
        const isBottomReached = intersection?.isIntersecting;

        if (
            enabledScrollLoad &&
            isBottomReached &&
            !state.loading &&
            hasMore &&
            paging.page > 1
        ) {
            loadMore(paging.page, paging.pageSize, memoParams);
        }
    }, [
        intersection?.isIntersecting,
        state.loading,
        hasMore,
        paging.page,
        paging.pageSize,
        enabledScrollLoad,
        memoParams,
        loadMore
    ]);


    return (
        <>

            <div className={cn(className)} style={style}>
                {items.map((item, index) => renderItem(item, index))}
            </div>

            {
                (!state.loading && items.length <= 0 && isCompleteFirstLoad.current) && <Empty />
            }

            {enabledScrollLoad && (
                <div
                    ref={intersectionRef}
                    className="py-10 flex-center flex-col min-h-30"
                >
                    {state.loading && <Spinner text={'加载中'} />}

                    {state.error && (
                        <div className="flex flex-col items-center text-red-500 gap-2">
                            <div className="flex items-center bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm">加载失败</span>
                            </div>
                            <Button
                                loading={state.loading}
                                onClick={() => !state.loading && loadMore(paging.page, paging.pageSize, memoParams)}
                            >
                                点此重试
                            </Button>
                        </div>
                    )}

                    {!hasMore && items.length > 0 && (
                        <Division >
                            <span className={'mx-2'}>🧩 已经没有更多碎片啦</span>
                        </Division>
                    )}
                </div>
            )}
        </>
    );
};