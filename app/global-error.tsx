'use client' // Error boundaries must be Client Components

export default function GlobalError({
                                        error,
                                        reset,
                                    }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        // 必须定义html结构 已替换根布局
        <html>
        <body>
        <h2>全局错误</h2>
        <button onClick={() => reset()}>Try again</button>
        </body>
        </html>
    )
}