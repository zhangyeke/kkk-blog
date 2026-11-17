/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-05 13:32:10
 * @FilePath: \blog\app\layout.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import "styles/tailwind.css"
import "styles/iconfont.css"
import type { Metadata } from "next"
import { globalFont, h1Font } from "@/assets/fonts"
import { RenderDialogProvider } from "@/components/k-view/Popup/useRenderDialog"
import { Toaster } from "@/components/ui/sonner"
import WebVitals from "@/components/WebVitals/WebVitals"
import { AppStoreProvider, ThemeProvider } from "@/providers"
import { auth } from "@/lib/auth"
import BlogEffects from "./blog/components/BlogEffects"
import { getAdminBranding } from "@/lib/admin/settings-store"
import { SITE_URL } from "@/lib/seo/site"

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getAdminBranding()
  return {
    metadataBase: SITE_URL,
    icons: {
      icon: brand.favicon,
      shortcut: brand.favicon,
      apple: brand.favicon,
    },
  }
}

export default async function RootLayout({ children }: ContainerProps) {
  const session = await auth()
  return (
    <html suppressHydrationWarning lang="zh-cn" className={`scroll-smooth ${globalFont.className} ${h1Font.variable} `}>
      <body className={"overflow-x-hidden overflow-y-auto"}>
        <WebVitals />
        <AppStoreProvider>
          <ThemeProvider roles={session?.user?.roles} attribute="class" defaultTheme="light" disableTransitionOnChange>
            <RenderDialogProvider>{children}</RenderDialogProvider>
            <BlogEffects />
            <Toaster position="top-center" richColors duration={1500} />
          </ThemeProvider>
        </AppStoreProvider>
      </body>
    </html>
  )
}
