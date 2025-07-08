import "styles/tailwind.css"
import {globalFont, h1Font} from "@/assets/fonts"
import {ThemeProvider} from "@/components/ThemeProvider/ThemeProvider";

export default function RootLayout({children}: ContainerProps) {
    return (
        <html suppressHydrationWarning lang="zh-cn" className={`${globalFont.className} ${h1Font.variable} `}>
        <body>
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
