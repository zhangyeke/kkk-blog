import {Metadata} from "next";
import Header from "./components/Layout/Header";
import {getPostCategoryList} from "@/service/postCategory";
import {headers} from "next/headers";


export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    }
}


export default async function BlogLayout({children}: Slots<'children'>) {
    const categoryList = await getPostCategoryList()
    const headerList = await headers()
    const pathname = headerList.get('k-pathname');
    console.log(pathname,"12321")
    return (
        <main>
            <Header categoryList={categoryList}/>
            {children}
        </main>
    )
}
