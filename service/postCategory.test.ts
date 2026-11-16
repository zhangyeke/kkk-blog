/** @jest-environment node */
import prisma from "@/lib/prisma"
import { getPostCategoryList, getPostCategoryWithPosts } from "./postCategory"

jest.mock("@/lib/prisma", () => ({
    __esModule: true,
    default: {postCategory: {findMany: jest.fn()}},
}))
jest.mock("next/cache", () => ({revalidatePath: jest.fn()}))
jest.mock("@/lib/admin-guard", () => ({requireAction: jest.fn(), requirePageAccess: jest.fn()}))

const findMany = jest.mocked(prisma.postCategory.findMany)

beforeEach(() => {
    jest.clearAllMocks()
    findMany.mockResolvedValue([])
})

test("blog category list defaults to enabled categories without mutating filters", async () => {
    const filters = {name: "随笔"}
    await getPostCategoryList(filters)
    expect(findMany).toHaveBeenCalledWith({where: {name: {contains: "随笔", mode: "insensitive"}, status: 1}})
    expect(filters).toEqual({name: "随笔"})

    await getPostCategoryList({status: 0})
    expect(findMany).toHaveBeenLastCalledWith({where: {status: 0}})
})

test("blog category-and-post query defaults to enabled categories and posts", async () => {
    await getPostCategoryWithPosts()
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {status: 1},
        include: {posts: expect.objectContaining({where: {status: 1}})},
    }))

    await getPostCategoryWithPosts({where: {status: 0}})
    expect(findMany).toHaveBeenLastCalledWith(expect.objectContaining({where: {status: 0}}))
})
