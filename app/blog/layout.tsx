
import { Metadata } from "next";
import { BackTop } from "@/components/k-view/BackTop";

import Header from "./components/Layout/Header";

import RouteFooter from "./components/Layout/RouteFooter";


export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    },
    icons: {
        icon: '/images/logo_transparent.png',
        apple: '/images/logo_transparent.png',
    },
}


export default async function BlogLayout({ children, drawer, footer }: Slots<'children' | 'drawer' | 'footer'>) {
    return (

        <>
            <section className={'flex flex-col min-h-screen'}>

                <Header />
                <main className={'flex-1 relative flex flex-col'}>
                    {children}
                </main>
                <BackTop />
                <RouteFooter>{footer}</RouteFooter>
                {drawer}
            </section>
        </>

    )
}
