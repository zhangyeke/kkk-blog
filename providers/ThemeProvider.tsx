"use client"
import {ThemeProvider as NextThemesProvider, type ThemeProviderProps} from "next-themes"
import React from "react"
import {useAppStore} from "@/hooks"
import {color2dark, rootRegisterProperty} from "@/lib/color"

export function ThemeProvider({
                                  children,
                                  ...props
                              }: ThemeProviderProps) {

    const {themes} = useAppStore(state => state)

    React.useEffect(() => {
        rootRegisterProperty(`--primary-dark`, color2dark(themes.primary))
        rootRegisterProperty(`--primary`, themes.primary)
    }, [themes])




    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}