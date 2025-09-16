import "styles/tailwind.css"
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
                enableSystem
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
