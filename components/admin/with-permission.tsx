"use client"

import React from "react"

import type { AdminAction } from "@/assets/enumerate/global"
import { usePermission } from "./permission-context"

/**
 * 按钮级权限高阶组件。
 *
 *   const DeletePostButton = withPermission("post:delete")(BaseButton)
 *
 * 无权限时渲染 `fallback`（默认 null），不渲染组件本身——
 * 不是 disabled，而是根本不出现，避免"看得到点不动"的挫败感。
 */
export function withPermission(action: AdminAction, options?: { fallback?: React.ReactNode }) {
    // 泛型放在内层函数上——柯里化写法里外层拿不到组件的 props 类型
    return function wrap<P extends object>(Component: React.ComponentType<P>) {
        function Guarded(props: P) {
            const {can} = usePermission()
            if (!can(action)) return <>{options?.fallback ?? null}</>
            return <Component {...props}/>
        }
        Guarded.displayName = `withPermission(${Component.displayName ?? Component.name ?? "Component"})`
        return Guarded
    }
}

/** 声明式写法，适合包一小段 JSX 而不是整个组件 */
export function Can({
    action,
    fallback = null,
    children,
}: {
    action: AdminAction
    fallback?: React.ReactNode
    children: React.ReactNode
}) {
    const {can} = usePermission()
    return <>{can(action) ? children : fallback}</>
}
