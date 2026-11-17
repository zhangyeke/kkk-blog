/** @jest-environment node */
import { requireAction } from "./guard"
import { ActionError } from "../actionMessageBack"
import { auth } from "../auth"
import { getAllowedKeys, getPermissionRoles } from "./permission-store"

jest.mock("../auth", () => ({auth: jest.fn()}))
jest.mock("./permission-store", () => ({
    getAllowedKeys: jest.fn(),
    getPermissionRoles: jest.fn(),
}))

beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(auth).mockResolvedValue({user: {id: "user-1", roles: "editor"}} as never)
    jest.mocked(getPermissionRoles).mockResolvedValue([
        {code: "editor", name: "编辑", description: null, isBuiltin: false, status: 1, scopeAll: false, sort: 1},
    ])
    jest.mocked(getAllowedKeys).mockResolvedValue([])
})

test("uses roles from the authenticated session", async () => {
    await expect(requireAction("post:create")).rejects.toBeInstanceOf(ActionError)
    expect(getAllowedKeys).toHaveBeenCalledWith("editor")
})

test("checks the resolved permission keys for a superAdmin session", async () => {
    jest.mocked(auth).mockResolvedValue({user: {id: "user-1", roles: "superAdmin"}} as never)
    jest.mocked(getPermissionRoles).mockResolvedValue([
        {code: "superAdmin", name: "超级管理员", description: null, isBuiltin: true, status: 1, scopeAll: true, sort: 0},
    ])
    jest.mocked(getAllowedKeys).mockResolvedValue([])

    await expect(requireAction("post:create")).rejects.toMatchObject({code: 401})
    expect(getAllowedKeys).toHaveBeenCalledWith("superAdmin")
})

test("denies the action when permission data cannot be read", async () => {
    jest.mocked(getAllowedKeys).mockRejectedValue(new Error("database unavailable"))

    await expect(requireAction("post:create")).rejects.toThrow("database unavailable")
})
