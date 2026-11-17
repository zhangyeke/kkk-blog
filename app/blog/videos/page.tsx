import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "视频素材",
    robots: {index: false, follow: false},
}

export default async function Page() {

    return (
        <div>
            视频素材
        </div>
    )
}
