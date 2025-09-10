import "styles/tailwind.css"
import {globalFont, h1Font} from "@/assets/fonts"
import {Toaster} from "@/components/ui/sonner"
import {ThemeProvider} from "@/components/ThemeProvider/ThemeProvider";
import WebVitals from "@/components/WebVitals/WebVitals";


export default function RootLayout({children}: ContainerProps) {
    return (
        <html suppressHydrationWarning lang="zh-cn" className={`${globalFont.className} ${h1Font.variable} `}>
        <body className={'overflow-y-auto overflow-x-hidden'}>
        <WebVitals/>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster position="top-center" richColors duration={1500}/>
        </ThemeProvider>
        </body>
        </html>
    )
}
