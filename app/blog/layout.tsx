import {Metadata} from "next";
import {fetchPhotoWall} from "@/app/api/material";
import http from "@/lib/http";

export const metadata: Metadata = {
    title: "博客"
}


export default async function BlogLayout({children, header, modal}: Slots<'children' | 'header' | 'modal'>) {
    const data = await http.get("/poem")
    console.log(data, "请求诗词")
    const res = await fetchPhotoWall({
        min_width: 1920,
        min_height: 500,
        orientation: "horizontal",
        editors_choice: true,
        per_page: 5,
    })
    console.log(res.hits, "请求图片素材")

    const posts = await http.get('/posts')
    console.log("文字",posts)
    return (
        <main>
            {header}
            {children}
            {modal}
        </main>
    )
}
