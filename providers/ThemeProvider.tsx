"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import React from "react"
import { useAppStore } from "@/hooks"
import { color2dark, rootRegisterProperty } from "@/lib/color"

export function ThemeProvider({
    children,
    roles,
    ...props
}: ThemeProviderProps & { roles?: string }) {

    const { themes } = useAppStore(state => state)

    React.useEffect(() => {
        rootRegisterProperty(`--primary-dark`, color2dark(themes.primary))
        rootRegisterProperty(`--primary`, themes.primary)
    }, [themes])

    /** disable-devtool 仅在浏览器端运行；用动态 import 避免 Next 服务端打包阶段触碰 window */
    React.useEffect(() => {
        if (process.env.NODE_ENV !== "production") return

        let cancelled = false
        void import("disable-devtool").then(({ default: runDisableDevtool }) => {
            if (cancelled) return
            runDisableDevtool({
                ignore: () => roles === "superAdmin",
            })
        })

        return () => {
            cancelled = true
        }
    }, [roles])


    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
