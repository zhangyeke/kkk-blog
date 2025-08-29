import {Metadata} from "next";
import Header from "@/app/blog/components/Layout/Header";
import {getPostCategoryList} from "@/service/PostCategory";
import blogConfig from "@/config/blog"

export const metadata: Metadata = {
    title: blogConfig.globalTitle,
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
