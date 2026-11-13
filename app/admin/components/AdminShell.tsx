"use client"

import React from "react"
import { usePathname } from "next/navigation"

import { AdminThemeContext } from "@/components/admin/admin-theme-context"
import { PermissionProvider } from "@/components/admin/permission-context"
import { RenderDialogProvider } from "@/components/k-view/Popup/useRenderDialog"
import { type AdminPresetId, DEFAULT_PRESET, isPresetId, PRESET_STORAGE_KEY } from "@/lib/admin-presets"
import { cn } from "@/lib/utils"

/**
 * 窄屏抽屉的开合状态。
 *
 * 侧栏由并行路由 `@sidebar` 提供、汉堡按钮在顶栏里，两者没有父子关系，
 * 所以用一个 context 把状态提到外壳层，避免各自维护一份。
 */
type MobileNavValue = { open: boolean; setOpen: (next: boolean) => void; collapsed: boolean; setCollapsed: (next: boolean) => void }

const AdminMobileNavContext = React.createContext<MobileNavValue | null>(null)

export function useAdminMobileNav(): MobileNavValue {
    return React.useContext(AdminMobileNavContext) ?? { open: false, setOpen: () => {}, collapsed: false, setCollapsed: () => {} }
}

const defaultAdminTheme = {
    preset: DEFAULT_PRESET,
    setPreset: () => {},
}

export function useAdminTheme() {
    return React.useContext(AdminThemeContext) ?? defaultAdminTheme
}

export type AdminShellUser = {
    id: string
    name: string
    email: string
    roles: string
    avatar: string | null
    /** 角色 code → 显示名（自定义角色也能正确显示） */
    roleNames?: Record<string, string>
}

/**
 * 后台外壳。
 *
 * 三个插槽由并行路由提供（@sidebar / @topbar / children），
 * 这里只负责布局、主题作用域与权限上下文注入。
 *
 * 主题作用域的关键：`data-preset` 挂在 .admin-shell 这个 div 上，
 * 而 CSS 里所有预设选择器都以 .admin-shell 开头——变量只在这棵子树里生效，
 * 博客主页用的是 :root 上那套，两者互不干扰。
 */
export function AdminShell({
    keys,
    sidebar,
    topbar,
    children,
}: {
    /** 当前用户。侧栏 / 顶栏各自从并行路由插槽拿用户，外壳本身不再消费它，
     *  但保留在 props 里作为外壳的公开契约（布局层统一注入） */
    user: AdminShellUser
    /** 服务端算好的权限 key 全集（page:* / action:*），透传给 PermissionProvider */
    keys: string[]
    sidebar: React.ReactNode
    topbar: React.ReactNode
    children: React.ReactNode
}) {
    const [preset, setPresetState] = React.useState<AdminPresetId>(DEFAULT_PRESET)
    const [navOpen, setNavOpen] = React.useState(false)
    const [navCollapsed, setNavCollapsed] = React.useState(false)
    const pathname = usePathname()

    // 切页后自动收起抽屉，否则移动端点完菜单还挡着内容
    React.useEffect(() => {
        setNavOpen(false)
    }, [pathname])

    // Esc 关闭抽屉
    React.useEffect(() => {
        if (!navOpen) return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setNavOpen(false)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [navOpen])

    // 首帧用默认预设渲染（与服务端一致，避免 hydration 不匹配），挂载后再恢复用户选择
    React.useEffect(() => {
        try {
            const saved = window.localStorage.getItem(PRESET_STORAGE_KEY)
            if (isPresetId(saved)) setPresetState(saved)
        } catch {
            /* 隐私模式下 localStorage 可能抛错，忽略即可 */
        }
    }, [])

    const setPreset = React.useCallback((next: AdminPresetId) => {
        setPresetState(next)
        try {
            window.localStorage.setItem(PRESET_STORAGE_KEY, next)
        } catch {
            /* 同上 */
        }
    }, [])

    const themeValue = React.useMemo(() => ({preset, setPreset}), [preset, setPreset])
    const navValue = React.useMemo(() => ({open: navOpen, setOpen: setNavOpen, collapsed: navCollapsed, setCollapsed: setNavCollapsed}), [navOpen, navCollapsed])

    return (
        <PermissionProvider keys={keys}>
            <AdminThemeContext.Provider value={themeValue}>
                <AdminMobileNavContext.Provider value={navValue}>
                    <div
                        data-preset={preset}
                        className="admin-shell flex h-dvh w-full overflow-hidden"
                        style={{background: "var(--adm-paper)", color: "var(--adm-ink)"}}
                    >
                        {/*
                         * 侧栏只有一份实例：窄屏是 fixed 抽屉（靠 translate 滑出），
                         * md 以上退回 static 常驻。不复制两份是为了避免菜单里的
                         * 折叠状态、React key 出现两套。
                         */}
                        {navOpen && (
                            <div
                                className="fixed inset-0 z-40 bg-black/25 md:hidden"
                                onClick={() => setNavOpen(false)}
                                aria-hidden
                            />
                        )}

                        <aside
                            className={cn(
                                "fixed inset-y-0 left-0 z-50 flex h-full w-[min(82vw,272px)] shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r",
                                "will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                                "md:static md:z-auto md:translate-x-0 md:transition-[width] md:duration-300 md:will-change-auto",
                                navCollapsed ? "md:w-[76px]" : "md:w-[236px]",
                                navOpen ? "translate-x-0" : "-translate-x-full",
                            )}
                            style={{borderColor: "var(--adm-line)", background: "var(--adm-paper-2)"}}
                        >
                            {sidebar}
                        </aside>

                        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                            {topbar}
                            <main className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 sm:px-5 sm:py-3">
                                <RenderDialogProvider>{children}</RenderDialogProvider>
                            </main>
                        </div>
                    </div>
                </AdminMobileNavContext.Provider>
            </AdminThemeContext.Provider>
        </PermissionProvider>
    )
}

