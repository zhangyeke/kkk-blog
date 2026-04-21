'use client' // Error boundaries must be Client Components
import PageError from "@/components/PageError";
export default function GlobalError({
                                        reset,
                                    }: {
    error: Error & { digest?: string }
    reset: () => void
}) {

    return (
        // 必须定义html结构 已替换根布局
        <html>
        <body>
        <PageError/>
        </body>
        </html>
    )
}