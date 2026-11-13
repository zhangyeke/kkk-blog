"use client"

import React from "react"

import type { AdminAction } from "@/lib/permissions"

/**
 * 动作权限上下文。
 *
 * 服务端（layout → getAllowedKeys）把「当前角色拥有的权限 key 全集」算好后注入一次，
 * 客户端组件通过 usePermission / withPermission / <Can> 消费，
 * 避免逐层透传 roles，也避免把整张权限矩阵（含其它角色）序列化到客户端。
 *
 * ── 为什么存的是「key 全集」而不是「动作白名单」──
 *
 * 菜单树驱动的 RBAC 里，权限 key 是**数据**：后台可以新建一个 action:menu:create，
 * 它不在 AdminAction 联合类型里。如果上下文只存强类型动作白名单，
 * 这类新 key 永远进不来，前端只能靠角色 code 猜 —— 那就退回改造前的老路了。
 *
 * 所以：上下文存 `action:*` 归一后的 code 集合，`can()` 同时接受
 * `"post:create"` 与 `"action:menu:create"` 两种写法（前缀自动剥掉）。
 *
 * 注意：这一层只负责「隐藏界面」。真正的拦截在服务端
 * （页面守卫 requirePageAccess、action 守卫 requireAction、数据层 scope），
 * 前端隐藏按钮只是体验优化，不是安全边界。
 */

/** 动作标识的「宽」形态：内置动作 code，或菜单表里读出来的原始 key */
export type PermissionAction = AdminAction | (string & {})

const ACTION_PREFIX = "action:"

/** 统一成不带前缀的 code：action:menu:create → menu:create */
function normalizeAction(key: string): string {
    return key.startsWith(ACTION_PREFIX) ? key.slice(ACTION_PREFIX.length) : key
}

const PermissionContext = React.createContext<readonly string[]>([])

export function PermissionProvider({
    keys,
    children,
}: {
    /** 服务端算好的权限 key 全集（page:* / action:*） */
    keys: string[]
    children: React.ReactNode
}) {
    // 只保留 action:* 并剥前缀：can() 判定的语义就是「能不能做这个动作」
    const actions = React.useMemo(
        () =>
            Array.from(
                new Set(
                    keys
                        .filter((key) => key.startsWith(ACTION_PREFIX))
                        .map((key) => normalizeAction(key)),
                ),
            ),
        [keys],
    )

    return <PermissionContext.Provider value={actions}>{children}</PermissionContext.Provider>
}

/**
 * 返回值结构与改造前保持一致（`{can}`），调用方
 * （<Can action="..." />、withPermission(...)、RowActions can={can}）无需任何改动。
 */
export function usePermission() {
    const actions = React.useContext(PermissionContext)
    return React.useMemo(
        () => ({
            actions,
            can: (key: PermissionAction) => actions.includes(normalizeAction(key)),
        }),
        [actions],
    )
}
