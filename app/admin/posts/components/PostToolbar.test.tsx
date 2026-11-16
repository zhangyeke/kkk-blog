import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import Link from "next/link"

import { ToolbarActionButton } from "@/app/admin/components/ToolbarActionButton"
import { PermissionProvider } from "@/components/admin/permission-context"
import { RenderDialogProvider } from "@/components/k-view/Popup/useRenderDialog"
import { PostToolbar } from "../PostsTable"

jest.mock("@/env.mjs", () => ({ env: {} }))
jest.mock("@/components/k-view/Form/components/Control", () => ({ Control: () => null }))
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))
jest.mock("@/service/post", () => ({
    deleteAdminPost: jest.fn(),
    updateAdminPostStatus: jest.fn(),
    getAdminPostForEdit: jest.fn(),
}))
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock("@/app/admin/components/AdminShell", () => ({ useAdminTheme: () => ({ preset: "moss" }) }))
jest.mock("@/app/blog/article/write/components/ArticleForm", () => ({
    ArticleForm: ({ onCancel }: { onCancel: () => void }) => (
        <div><p>文章表单</p><button onClick={onCancel}>取消表单</button></div>
    ),
}))

test("only mounts the create action and its dialog while post:create is granted", async () => {
    const toolbar = (keys: string[]) => (
        <PermissionProvider keys={keys}>
            <RenderDialogProvider>
                <PostToolbar />
            </RenderDialogProvider>
        </PermissionProvider>
    )
    const { rerender } = render(toolbar(["page:posts"]))
    expect(screen.queryByRole("button", { name: "新增文章" })).not.toBeInTheDocument()

    rerender(toolbar(["page:posts", "action:post:create"]))
    const button = screen.getByRole("button", { name: "新增文章" })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("type", "button")
    fireEvent.click(button)
    const dialog = await screen.findByRole("dialog", { name: "新建文章" })
    expect(dialog).toHaveClass("admin-dialog-content", "admin-article-dialog")
    expect(dialog).toHaveAttribute("data-preset", "moss")

    fireEvent.click(screen.getByRole("button", { name: "取消表单" }))
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "新建文章" })).not.toBeInTheDocument())
    rerender(toolbar(["page:posts"]))
    expect(screen.queryByRole("button", { name: "新增文章" })).not.toBeInTheDocument()
    expect(screen.queryByRole("dialog", { name: "新建文章" })).not.toBeInTheDocument()
})

test("renders navigation actions as themed links", () => {
    render(
        <ToolbarActionButton asChild>
            <Link href="/blog/me/bookmark/edit">新增书签</Link>
        </ToolbarActionButton>,
    )

    const link = screen.getByRole("link", { name: "新增书签" })
    expect(link).toHaveAttribute("href", "/blog/me/bookmark/edit")
    expect(link).toHaveClass("bg-[var(--adm-c1)]")
})
