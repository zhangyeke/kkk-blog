/** @jest-environment node */
import { getMePosts, getPostById, getPostsByPage, updatePost } from "./post"
import prisma from "@/lib/prisma"
import { checkAuth } from "@/service/auth"
import { auth } from "@/lib/auth"

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))
jest.mock("@/service/auth", () => ({ checkAuth: jest.fn() }))
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/markdown", () => ({ getPlainText: jest.fn(async () => "摘要") }))
jest.mock("@/validators/post", () => ({ addPostSchema: { parse: jest.fn((value) => value) } }))
jest.mock("next/server", () => ({ after: jest.fn() }))

const findMany = jest.mocked(prisma.post.findMany)
const count = jest.mocked(prisma.post.count)
beforeEach(() => {
  jest.clearAllMocks()
  findMany.mockResolvedValue([])
  count.mockResolvedValue(0)
  jest.mocked(checkAuth).mockResolvedValue({ id: "owner" } as Awaited<ReturnType<typeof checkAuth>>)
  jest.mocked(auth).mockResolvedValue(null as never)
})

test("starts list and filtered count concurrently; does not serialize article content", async () => {
  let finish!: (rows: never[]) => void
  findMany.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }) as never
  )
  count.mockResolvedValue(13)
  const result = getPostsByPage({ page: 2, pageSize: 6, where: { categoryId: 3 } })
  expect(count).toHaveBeenCalledWith({ where: { AND: [{ status: 1 }, { categoryId: 3 }] } })
  finish([{ id: 1, content: "大段正文" } as never])
  const response = await result
  expect(response.code).toBe(200)
  expect(response.data.totalPages).toBe(3)
  expect(response.data.list[0]).toEqual({ id: 1, summary: "摘要" })
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 6, take: 6 }))
})

test.each([
  [0, 10],
  [1, 0],
  [1, 51],
  [1.2, 10],
  [NaN, 10],
])("rejects invalid paging %s/%s before querying", async (page, pageSize) => {
  expect((await getPostsByPage({ page, pageSize })).code).not.toBe(200)
  expect(findMany).not.toHaveBeenCalled()
  expect(count).not.toHaveBeenCalled()
})

test("does not report success when the database list query fails", async () => {
  findMany.mockRejectedValueOnce(new Error("database unavailable"))
  expect((await getPostsByPage({ page: 1, pageSize: 6 })).code).not.toBe(200)
})

test("keeps ownership in personal queries even if the caller supplies another userId", async () => {
  await getMePosts({ page: 1, pageSize: 6, userId: "another-user" })
  expect(count).toHaveBeenCalledWith({ where: { AND: [{ userId: "owner", status: 1 }, { userId: "another-user" }] } })
})

test("pins article updates to the authenticated owner", async () => {
  await updatePost({ id: 7, title: "标题" } as Parameters<typeof updatePost>[0])
  expect(prisma.post.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7, userId: "owner" } }))
})

test("does not return another user's draft", async () => {
  jest.mocked(prisma.post.findUnique).mockResolvedValueOnce({ id: 1, status: 2, userId: "someone" } as never)
  expect((await getPostById(1)).code).not.toBe(200)
})

test("returns a controlled response for a missing article", async () => {
  jest.mocked(prisma.post.findUnique).mockResolvedValueOnce(null)
  expect((await getPostById(1)).message).toBe("文章不存在")
})
