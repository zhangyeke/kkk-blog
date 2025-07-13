import {Metadata} from "next";
import {env} from "@/env.mjs";
import http from "@/lib/http";


export const metadata: Metadata = {
    title: "博客"
}


export default async function BlogLayout({children, header,modal}: Slots<'children' | 'header' | 'modal'>) {
    console.log(env,"??")
    const data = await http.get("/poem")
    console.log(data,"请求")
    return (
        <main>
            {header}
            {children}
            {modal}
        </main>
    )
}
