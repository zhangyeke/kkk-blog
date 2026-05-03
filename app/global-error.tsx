/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-03 18:58:22
 * @FilePath: \blog\app\global-error.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
'use client' // Error boundaries must be Client Components
import PageError from "@/components/PageError";
export default function GlobalError({
    reset,
    error,

}: {
    error: Error & { digest?: string }
    reset: () => void
}) {

    return (
        // 必须定义html结构 已替换根布局
        <html>
            <body>
                <PageError  />
            </body>
        </html>
    )
}