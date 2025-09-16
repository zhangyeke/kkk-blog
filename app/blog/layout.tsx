import {Metadata} from "next";
import Header from "./components/Layout/Header";
import {getPostCategoryList} from "@/service/postCategory";


export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    }
}


export default async function BlogLayout({children, drawer}: Slots<'children' | 'drawer'>) {
    const categoryList = await getPostCategoryList()
    return (
        <main>
            <Header categoryList={categoryList}/>
            {children}
            {drawer}
        </main>
    )
}
