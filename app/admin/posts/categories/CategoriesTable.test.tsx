import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { PermissionProvider } from "@/components/admin/permission-context"
import { RenderDialogProvider } from "@/components/k-view/Popup/useRenderDialog"
import { deleteAdminPostCategory, updateAdminPostCategory } from "@/service/postCategory"
import { CategoriesTable, CategoryToolbar } from "./CategoriesTable"

jest.mock("@/env.mjs", () => ({env: {}}))
jest.mock("@/service/fileUpload", () => ({uploadImage: jest.fn()}))
jest.mock("@/service/postCategory", () => ({deleteAdminPostCategory: jest.fn(), updateAdminPostCategory: jest.fn()}))
jest.mock("next/navigation", () => ({useRouter: () => ({push: jest.fn(), refresh: jest.fn()})}))
jest.mock("@/app/admin/components/AdminShell", () => ({useAdminTheme: () => ({preset: "moss"})}))
jest.mock("../../components/AdminForm", () => ({
    AdminForm: ({defaultValues}: {defaultValues: {name: string}}) => (
        <p>{defaultValues.name ? `正在修改${defaultValues.name}` : "正在新增分类"}</p>
    ),
}))

const row = {id: 3, name: "随笔", icon: null, status: 1, postCount: 0, createdAt: "2026-01-01T00:00:00.000Z"}

function renderTable(keys: string[]) {
    return render(
        <PermissionProvider keys={keys}>
            <RenderDialogProvider>
                <CategoriesTable rows={[row]} page={1} pageSize={10} totalPages={1} total={1} query={{keyword: "", status: "all"}}/>
            </RenderDialogProvider>
        </PermissionProvider>,
    )
}

test("shows columns and allowed row actions, and opens edit with the selected category", async () => {
    renderTable(["action:postCategory:update"])
    const table = screen.getByRole("table", {name: "文章分类列表"})
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent))
        .toEqual(["分类名称", "图标", "文章数", "状态", "创建时间", "操作"])
    expect(within(table).queryByRole("button", {name: /删除/})).not.toBeInTheDocument()

    fireEvent.click(within(table).getByRole("button", {name: "修改"}))
    const dialog = await screen.findByRole("dialog", {name: "修改分类"})
    expect(dialog).toHaveAttribute("data-preset", "moss")
    expect(dialog).toHaveTextContent("正在修改随笔")
})

test("confirms deletion before calling the service", async () => {
    jest.mocked(deleteAdminPostCategory).mockResolvedValue({code: 200, message: "已删除"} as Awaited<ReturnType<typeof deleteAdminPostCategory>>)
    renderTable(["action:postCategory:delete"])
    fireEvent.click(screen.getByRole("button", {name: "删除「随笔」"}))
    expect(deleteAdminPostCategory).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", {name: "删除", hidden: false}))
    await waitFor(() => expect(deleteAdminPostCategory).toHaveBeenCalledWith(3))
})

test("only users with create permission can open the category form", async () => {
    const {rerender} = render(
        <PermissionProvider keys={[]}><RenderDialogProvider><CategoryToolbar/></RenderDialogProvider></PermissionProvider>,
    )
    expect(screen.queryByRole("button", {name: "新增分类"})).not.toBeInTheDocument()

    rerender(
        <PermissionProvider keys={["action:postCategory:create"]}><RenderDialogProvider><CategoryToolbar/></RenderDialogProvider></PermissionProvider>,
    )
    fireEvent.click(screen.getByRole("button", {name: "新增分类"}))
    expect(await screen.findByRole("dialog", {name: "新增分类"})).toHaveTextContent("正在新增分类")
})

test("updates category status asynchronously and blocks repeated toggles", async () => {
    let resolveUpdate!: (result: Awaited<ReturnType<typeof updateAdminPostCategory>>) => void
    jest.mocked(updateAdminPostCategory).mockReturnValue(new Promise((resolve) => {resolveUpdate = resolve}))
    renderTable(["action:postCategory:update"])

    const toggle = screen.getByRole("switch", {name: "禁用分类「随笔」"})
    expect(toggle).toBeChecked()
    fireEvent.click(toggle)
    expect(toggle).toBeDisabled()
    expect(toggle).toHaveAttribute("aria-busy", "true")
    expect(updateAdminPostCategory).toHaveBeenCalledWith({id: 3, status: 0})

    resolveUpdate({code: 200, message: "已更新"} as Awaited<ReturnType<typeof updateAdminPostCategory>>)
    await waitFor(() => expect(toggle).not.toBeChecked())
    expect(toggle).not.toBeDisabled()
})

test("keeps status unchanged if the update fails", async () => {
    jest.mocked(updateAdminPostCategory).mockResolvedValue({code: 500, message: "失败"} as Awaited<ReturnType<typeof updateAdminPostCategory>>)
    renderTable(["action:postCategory:update"])
    const toggle = screen.getByRole("switch", {name: "禁用分类「随笔」"})
    fireEvent.click(toggle)
    await waitFor(() => expect(toggle).not.toBeDisabled())
    expect(toggle).toBeChecked()
})
