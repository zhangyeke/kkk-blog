import {Metadata} from "next";
import Header from "./components/Layout/Header";
import {getPostCategoryList} from "@/service/postCategory";


export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    }
}


export default async function BlogLayout({children, drawer, footer}: Slots<'children' | 'drawer' | 'footer'>) {
    const categoryList = await getPostCategoryList()

    return (
        <section className={'min-h-full flex flex-col'}>
            <Header categoryList={categoryList}/>
            <main className={'flex-1'}>
                {children}
            </main>
            {footer}
            {drawer}
        </section>
    )
}
