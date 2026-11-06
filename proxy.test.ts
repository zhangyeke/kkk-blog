/** @jest-environment node */
import { NextRequest } from "next/server"
import { proxy } from "./proxy"
import { auth } from "@/lib/auth"

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }))
beforeEach(() => jest.clearAllMocks())

test("public pages skip authentication in the proxy", async () => {
  const response = await proxy(new NextRequest("http://localhost:3000/blog"))
  expect(response.status).toBe(200)
  expect(auth).not.toHaveBeenCalled()
})

test.each(["/blog/article/write", "/blog/article/write/42", "/blog/me/articles", "/admin/user"])(
  "protects %s and retains the return query",
  async (pathname) => {
    jest.mocked(auth).mockResolvedValue(null as never)
    const response = await proxy(new NextRequest(`http://localhost:3000${pathname}?draft=true`))
    expect(response.status).toBe(307)
    const target = new URL(response.headers.get("location")!)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("callbackUrl")).toBe(`${pathname}?draft=true`)
  }
)
