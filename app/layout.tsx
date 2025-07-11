import "styles/tailwind.css"
import {globalFont, h1Font} from "@/assets/fonts"
import {ThemeProvider} from "@/components/ThemeProvider/ThemeProvider";
import {Metadata} from "next";
import WebVitals from "@/components/WebVitals/WebVitals";

export const metadata: Metadata = {
    title: {
        template: '%s | kkk',
        default: 'kkk',
    },
}

export default function RootLayout({children}: ContainerProps) {
    return (
        <html suppressHydrationWarning lang="zh-cn" className={`${globalFont.className} ${h1Font.variable} `}>
        <body>
        <WebVitals/>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
        </body>
        </html>
    )
}
