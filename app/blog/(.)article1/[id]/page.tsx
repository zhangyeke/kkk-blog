
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "文章预览",
    robots: {index: false, follow: false},
}

export default async function Web() {
    return (
        <div className="text-primary">
            被拦截的文章详情页
        </div>
    )
}
