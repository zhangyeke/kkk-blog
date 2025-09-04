import {Metadata} from "next";
import {GLOBAL_TITLE} from "config/blog"
import Header from "./components/Layout/Header";
import {getPostCategoryList} from "@/service/postCategory";

export const metadata: Metadata = {
    title: GLOBAL_TITLE,
}


export default async function BlogLayout({children}: Slots<'children'>) {
    const categoryList = await getPostCategoryList()
    console.log("分类", categoryList)

    return (
        <main>
            <Header categoryList={categoryList}/>
            {children}
        </main>
    )
}
