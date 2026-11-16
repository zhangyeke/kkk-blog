import type {PostPayload} from "@/validators/post";
import type { Prisma } from "@prisma/client";

export type {Post} from "@prisma/client"
export type {PostPayload}

// 旧名保留，避免其他调用点报错；语义扩为「表单字段 + 可选 status」
export type addPostParams = PostPayload

export const postWithUserInclude = {
    category: true,
    user: {
        select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
        }
    }
}

/**
 * Server Action / RSC 列表 DTO 只查询卡片使用的字段；正文仍用于服务器端摘要，
 * 但用户邮箱、状态、时间戳等无关字段不会从数据库加载或序列化给客户端。
 */
export const postListSelect = {
    id: true,
    title: true,
    cover: true,
    categoryId: true,
    tags: true,
    content: true,
    createdAt: true,
    pv: true,
    favoriteCount: true,
    category: { select: { name: true } },
    user: { select: { name: true, avatar: true } },
} satisfies Prisma.PostSelect


// 1. 定义查询参数的类型，确保它与你 findMany 里的 include 逻辑一致
export type PostWithUser<T = unknown> = Prisma.PostGetPayload<{
    include: typeof postWithUserInclude & T
}> & { summary?: string }

/** 列表卡片只接收实际展示字段和摘要；正文仅由文章详情接口返回。 */
export type PostListItem = Omit<Prisma.PostGetPayload<{ select: typeof postListSelect }>, "content"> & {
    summary?: string
}

export type PostWithFavorites = PostWithUser<{
    favorites: {
        where: {
            userId: string
        },
        take: number
    }
}>
