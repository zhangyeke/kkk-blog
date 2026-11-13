"use client"

import type { ComponentProps } from "react"
import { useRouter } from "next/navigation"

import { DataTablePager } from "@/components/k-view/DataTable"
import { useTableBusy } from "@/components/k-view/DataTable/busy"

type Props = Omit<ComponentProps<typeof DataTablePager>, "onNavigate" | "pending">

/**
 * 给服务端页面用的分页器。
 *
 * `page.tsx` 是服务端组件，拿不到 `useTableBusy()`；但分页又和文章页一样
 * 需要在翻页时盖加载蒙层。这里包一层客户端壳，行为与 `PostsTable` 内一致。
 */
export function TableBusyPager(props: Props) {
    const router = useRouter()
    const busy = useTableBusy()

    return (
        <DataTablePager
            {...props}
            onNavigate={(href) => busy.run(() => router.push(href, { scroll: false }))}
            pending={busy.pending}
        />
    )
}
