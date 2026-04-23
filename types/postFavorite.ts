import {Prisma} from "@prisma/client";
import {postWithUserInclude} from "@/types/post";

export type {Favorite} from "@prisma/client"


export const favoriteWithPostInclude = {
    user: {
        select: {
            id: true,
            name: true,
            avatar: true, // 假设你有头像字段
            email: true
        }
    },
    post: {
        include: postWithUserInclude
    }
}

// 1. 定义查询参数的类型，确保它与你 findMany 里的 include 逻辑一致
export type FavoriteWithPost<T = unknown> = Prisma.FavoriteGetPayload<{
    include: typeof favoriteWithPostInclude & T
}>

/* 关联文章->文章关联收藏列表*/
export type FavoriteWithPostWithFavorites = Prisma.FavoriteGetPayload<{
    include: typeof favoriteWithPostInclude & {
        post: {
            include: {
                favorites: {
                    where: {
                        userId: string
                    },
                    take: number
                }
            }
        }
    }
}>