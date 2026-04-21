"use client"

import {SessionProvider} from "next-auth/react"
import React from "react"

/**
 * 包装 SessionProvider 的客户端组件
 * 这样可以确保 Context 在整个应用中可用
 */
export const AuthProvider = ({children}: { children: React.ReactNode }) => {
    return (
        <SessionProvider
            refetchInterval={5 * 60}
            refetchOnWindowFocus={false}
        >
            {children}
        </SessionProvider>
    )
}