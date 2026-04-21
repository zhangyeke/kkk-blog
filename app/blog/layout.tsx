import {Metadata} from "next";
import Header from "./components/Layout/Header";
import SplashCursor from "@/components/bits/SplashCursor";
import {BackTop} from "@/components/BackTop";


export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    }
}


export default async function BlogLayout({children, drawer, footer}: Slots<'children' | 'drawer' | 'footer'>) {
    return (
        <section className={'min-h-full flex flex-col'}>
            <SplashCursor/>
            <Header/>
            <main className={'flex-1 relative flex flex-col'}>
                {children}
            </main>
            <BackTop/>
            {footer}
            {drawer}
        </section>
    )
}
