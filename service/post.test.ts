/** @jest-environment node */
import { createPost, getMePosts, getPostById, getPostsByPage, updatePost } from "./post"
import prisma from "@/lib/prisma"
import { checkAuth } from "@/service/auth"
import { auth } from "@/lib/auth"

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))
jest.mock("@/service/auth", () => ({ checkAuth: jest.fn() }))
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/markdown", () => ({ getPlainText: jest.fn(async () => "摘要") }))
// validators/post.ts 会经由 service/postCategory.ts 拖入 next/cache，jest 里加载失败，先隔离掉。
jest.mock("@/service/postCategory", () => ({ getPostCategoryList: jest.fn() }))
// 只替换 parse 为可断言的 jest.fn，行为仍走真实 zod：
// addPostSchema 没有 status 字段，zod 会 strip 掉它（正是本次 bug 的成因）；
// postPayloadSchema 显式声明了 status，会保留。
jest.mock("@/validators/post", () => {
  const actual = jest.requireActual<typeof import("@/validators/post")>("@/validators/post")
  return {
    ...actual,
    addPostSchema: { parse: jest.fn((value: unknown) => actual.addPostSchema.parse(value)) },
    postPayloadSchema: { parse: jest.fn((value: unknown) => actual.postPayloadSchema.parse(value)) },
  }
})
jest.mock("next/server", () => ({ after: jest.fn() }))

const findMany = jest.mocked(prisma.post.findMany)
const count = jest.mocked(prisma.post.count)
beforeEach(() => {
  jest.clearAllMocks()
  findMany.mockResolvedValue([])
  count.mockResolvedValue(0)
  jest.mocked(prisma.post.create).mockResolvedValue({ id: 1 } as never)
  jest.mocked(prisma.post.update).mockResolvedValue({ id: 7 } as never)
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
  await updatePost({ id: 7, title: "标题", categoryId: 1 } as Parameters<typeof updatePost>[0])
  expect(prisma.post.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7, userId: "owner" } }))
})

// 回归：addPostSchema 不含 status，zod 会 strip 未知键，导致草稿按钮传的 status: 2 落库变 1。
test("keeps draft status when creating", async () => {
  await createPost({ title: "草稿", categoryId: 1, status: 2 } as never)
  expect(prisma.post.create).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 2 }) })
  )
})

test("keeps draft status when updating", async () => {
  await updatePost({ id: 7, title: "标题", categoryId: 1, status: 2 } as never)
  expect(prisma.post.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: expect.objectContaining({ status: 2 }) })
  )
})

test("leaves status undefined when not provided", async () => {
  await createPost({ title: "发布", categoryId: 1 } as never)
  const arg = jest.mocked(prisma.post.create).mock.calls[0]?.[0] as { data: Record<string, unknown> }
  expect(arg.data.status).toBeUndefined()
})

// 直接断言 schema 本身：postPayloadSchema 保留 status，addPostSchema 会 strip。
test("postPayloadSchema keeps status while addPostSchema strips it", () => {
  const { addPostSchema, postPayloadSchema } = jest.requireActual<typeof import("@/validators/post")>(
    "@/validators/post"
  )
  const payload = { title: "草稿", categoryId: 1, status: 2 }
  expect(postPayloadSchema.parse(payload).status).toBe(2)
  expect(addPostSchema.parse(payload)).not.toHaveProperty("status")
})

test("does not return another user's draft", async () => {
  jest.mocked(prisma.post.findUnique).mockResolvedValueOnce({ id: 1, status: 2, userId: "someone" } as never)
  expect((await getPostById(1)).code).not.toBe(200)
})

test("returns a controlled response for a missing article", async () => {
  jest.mocked(prisma.post.findUnique).mockResolvedValueOnce(null)
  expect((await getPostById(1)).message).toBe("文章不存在")
})
