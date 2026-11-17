
import type { Metadata } from "next";
import { BackTop } from "@/components/k-view/BackTop";
import { getBlogBranding } from "@/lib/admin/settings-store";

import Header from "./components/Layout/Header";

import RouteFooter from "./components/Layout/RouteFooter";


export async function generateMetadata(): Promise<Metadata> {
    const blog = await getBlogBranding()
    const description = blog.description?.trim() || "记录技术实践、生活见闻与旅行足迹。"

    return {
        title: {
            template: `%s | ${blog.name}`,
            default: blog.name,
        },
        description,
        applicationName: blog.name,
        icons: {
            icon: blog.logo,
            shortcut: blog.logo,
            apple: blog.logo,
        },
        openGraph: {
            type: "website",
            locale: "zh_CN",
            siteName: blog.name,
            title: blog.name,
            description,
            images: [blog.logo],
        },
        twitter: {
            card: "summary_large_image",
            title: blog.name,
            description,
            images: [blog.logo],
        },
    }
}


export default async function BlogLayout({ children, drawer, footer }: Slots<'children' | 'drawer' | 'footer'>) {
    return (

        <>
            <section className="flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-clip">

                <Header />
                <main className="relative flex w-full min-w-0 max-w-full flex-1 flex-col">
                    {children}
                </main>
                <BackTop />
                <RouteFooter>{footer}</RouteFooter>
                {drawer}
            </section>
        </>

    )
}
