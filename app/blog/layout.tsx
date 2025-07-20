import {Metadata} from "next";
import http from "@/lib/http";
import {fetchPhotoWall} from "@/service/Material";

export const metadata: Metadata = {
    title: "博客"
}


export default async function BlogLayout({children, header}: Slots<'children' | 'header'>) {
    const data = await http.get("/poem")
    console.log(data, "请求诗词")
    // const res = await http.get('/material',{
    //     params:{
    //         min_width: 1920,
    //         min_height: 500,
    //         orientation: "horizontal",
    //         editors_choice: true,
    //         per_page: 5,
    //     }
    // })
    // console.log(res, "请求图片素材")

    const posts = await http.get('/posts')
    console.log("文字",posts)
    return (
        <main>
            {header}
            {children}
        </main>
    )
}
