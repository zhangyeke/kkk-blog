import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { PermissionProvider } from "@/components/admin/permission-context"
import { RenderDialogProvider } from "@/components/k-view/Popup/useRenderDialog"
import { getAdminPostForEdit } from "@/service/post"
import { PostsTable } from "./PostsTable"

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
    ArticleForm: ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => (
        <div><button onClick={onSuccess}>保存文章</button><button onClick={onCancel}>取消编辑</button></div>
    ),
}))

test("shows separate post fields and keeps permitted actions in the visible operation column", () => {
    render(
        <PermissionProvider keys={["action:post:update"]}>
          <RenderDialogProvider>
            <PostsTable
                rows={[{
                    id: 1,
                    title: "测试文章",
                    cover: "",
                    authorName: "作者甲",
                    categoryName: "随笔",
                    status: 1,
                    pv: 0,
                    favoriteCount: 0,
                    updatedAt: new Date(2026, 0, 1),
                }]}
                page={1}
                pageSize={10}
                totalPages={1}
                total={1}
                query={{}}
            />
          </RenderDialogProvider>
        </PermissionProvider>,
    )

    const table = screen.getByRole("table", { name: "文章列表" })
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent))
        .toEqual(["封面", "标题", "作者", "分类", "状态", "浏览", "收藏", "更新", "操作"])
    const row = within(table).getByRole("row", { name: /测试文章/ })
    const cells = within(row).getAllByRole("cell")
    expect(cells.slice(0, 4).map((cell) => cell.textContent)).toEqual(["—", "测试文章", "作者甲", "随笔"])
    expect(within(row).queryByRole("button", { name: /预览/ })).not.toBeInTheDocument()

    const editButton = within(row).getByRole("button", { name: "编辑" })
    expect(editButton.closest("td")).toBe(cells[8])
    expect(editButton.closest(".opacity-0")).toBeNull()
    expect(within(row).queryByRole("button", { name: /删除/ })).not.toBeInTheDocument()
})

test("opens the cover preview and restores focus on Escape", async () => {
    render(
        <RenderDialogProvider><PostsTable
            rows={[{
                id: 1,
                title: "测试文章",
                cover: "/images/cover.png",
                authorName: "作者甲",
                categoryName: "随笔",
                status: 1,
                pv: 0,
                favoriteCount: 0,
                updatedAt: new Date(2026, 0, 1),
            }]}
            page={1}
            pageSize={10}
            totalPages={1}
            total={1}
            query={{}}
        /></RenderDialogProvider>,
    )

    const trigger = screen.getByRole("button", { name: "预览《测试文章》的封面" })
    fireEvent.click(trigger)
    const preview = await screen.findByRole("dialog", { name: "封面预览" })
    expect(preview).toHaveAccessibleDescription("测试文章")
    fireEvent.keyDown(preview, { key: "Escape" })
    await waitFor(() => expect(preview).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
})

test("opens edit through the dialog provider and loads the selected article", async () => {
    jest.mocked(getAdminPostForEdit).mockResolvedValue({
        code: 200,
        data: { id: 7, title: "测试文章" },
    } as Awaited<ReturnType<typeof getAdminPostForEdit>>)

    render(
        <PermissionProvider keys={["action:post:update"]}>
            <RenderDialogProvider>
                <PostsTable
                    rows={[{ id: 7, title: "测试文章", cover: "", authorName: "作者甲", categoryName: "随笔", status: 1, pv: 0, favoriteCount: 0, updatedAt: new Date(2026, 0, 1) }]}
                    page={1} pageSize={10} totalPages={1} total={1} query={{}}
                />
            </RenderDialogProvider>
        </PermissionProvider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "编辑" }))
    const dialog = await screen.findByRole("dialog", { name: "编辑文章" })
    expect(dialog).toHaveAttribute("data-preset", "moss")
    await waitFor(() => expect(getAdminPostForEdit).toHaveBeenCalledWith(7))
    fireEvent.click(await screen.findByRole("button", { name: "取消编辑" }))
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
})
