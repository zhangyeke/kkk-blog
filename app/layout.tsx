/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 13:43:43
 * @FilePath: \blog\app\layout.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import "styles/tailwind.css"
import "styles/iconfont.css"
import {globalFont, h1Font} from "@/assets/fonts"
import {Toaster} from "@/components/ui/sonner"
import WebVitals from "@/components/WebVitals/WebVitals";
import {AppStoreProvider, ThemeProvider} from "@/providers";


export default function RootLayout({children}: ContainerProps) {

    return (
        <html suppressHydrationWarning lang="zh-cn" className={`${globalFont.className} ${h1Font.variable} `}>
            <body className={'overflow-y-auto overflow-x-hidden'}>
            <WebVitals/>
            <AppStoreProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="top-center" richColors duration={1500}/>
                </ThemeProvider>

            </AppStoreProvider>

            </body>
        </html>

    )
}
