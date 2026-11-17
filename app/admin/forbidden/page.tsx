import type { Metadata } from "next"
import Link from "next/link"

import { requireAdminUser } from "@/lib/admin/guard"
import { getMenuTree } from "@/lib/admin/menu-store"
import { flattenTree } from "@/lib/admin/menu-tree"
import { roleLabel } from "@/lib/admin/permissions"

export const metadata: Metadata = {title: "无权访问"}

/**
 * 403 页。
 *
 * 参数是 `key`（形如 `page:users`），来自中间件与 requirePageAccess 的重定向。
 * 名字从菜单树里按 permissionKey 反查 —— 菜单改名（例如「菜单权限管理」→「菜单管理」）
 * 后 403 文案自动跟着变，不用再来改这个文件。
 */
export default async function ForbiddenPage({
    searchParams,
}: {
    searchParams: Promise<{ key?: string }>
}) {
    const params = await searchParams
    const user = await requireAdminUser()

    const key = params.key
    // 先按 permissionKey 反查节点名（flattenTree 把整棵树拍平，等价于逐根 flatMap）
    const deniedName = key
        ? flattenTree(await getMenuTree()).find((node) => node.row.permissionKey === key)?.row.name
        : undefined

    return (
        <div className="mx-auto grid min-h-[62vh] w-full max-w-[560px] place-items-center place-content-center py-16 text-center">
            <div className="adm-rise">
                <div className="adm-serif text-5xl md:text-6xl leading-none" style={{color: "var(--adm-line)"}}>403</div>
                <h1 className="adm-serif mt-4 text-lg md:text-xl" style={{color: "var(--adm-ink)"}}>
                    没有访问权限
                </h1>
                <p className="mt-2 text-sm md:text-base leading-relaxed" style={{color: "var(--adm-ink-3)"}}>
                    {deniedName ? `「${deniedName}」仅对更高权限的角色开放。` : "该页面仅对更高权限的角色开放。"}
                    <br/>
                    当前身份：{roleLabel(user.roles, user.roleNames)}
                </p>
                <Link
                    href="/admin"
                    className="adm-action mt-6 inline-flex h-9 items-center rounded-lg px-4 text-sm md:text-base transition-colors"
                >
                    回到概览
                </Link>
            </div>
        </div>
    )
}
