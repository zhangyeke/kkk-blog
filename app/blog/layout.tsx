/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-03 18:06:41
 * @FilePath: \blog\app\blog\layout.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Metadata } from "next";
import Header from "./components/Layout/Header";
import SplashCursor from "@/components/bits/SplashCursor";
import SakuraOverlay from "@/components/SakuraOverlay";
import { BackTop } from "@/components/BackTop";


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
            <SakuraOverlay delay={200} />

            <section className={' min-h-full flex flex-col'}>

                <SplashCursor />
                <Header />
                <main className={'flex-1 relative flex flex-col'}>
                    {children}
                </main>
                <BackTop />
                {footer}
                {drawer}
            </section>
        </>

    )
}
