'use server';
import prisma from "@/lib/prisma";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
import {checkAuth} from "@/service/auth";
import {Prisma} from "@prisma/client";
import {FavoriteWithPost, favoriteWithPostInclude, FavoriteWithPostWithFavorites} from "@/types/postFavorite";
import {merge} from "lodash";


export async function getFavorites<T = FavoriteWithPost>({
                                                             page,
                                                             pageSize,
                                                             ...params
                                                         }: Prisma.FavoriteFindManyArgs & Paging) {
    try {
        const favorites = await prisma.favorite.findMany({
            orderBy: {createdAt: 'desc'},
            include: favoriteWithPostInclude,
            ...params,
            skip: (page - 1) * pageSize, // 跳过前面的页数
            take: pageSize,             // 每页查多少条
            // 关联查询：收藏 -> 文章 -> (作者 & 分类)

        }) as T[]
        const totalCount = await prisma.favorite.count();
        return backSuccessMessage("获取收藏列表成功", {
            list: favorites,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
        })

    } catch {
        return backFailMessage('获取收藏列表失败', {
            list: [],
            totalPages: 0,
            currentPage: 0,
        })
    }
}

/*查询登录用户的收藏列表*/
export async function getMeFavorites({page, pageSize, ...params}: Prisma.FavoriteWhereInput & Paging) {
    try {
        const user = await checkAuth()
        const favorites = await getFavorites<FavoriteWithPostWithFavorites>({
            where: {
                ...params,
                userId: user.id,
            },
            page,
            pageSize,
            include: merge(favoriteWithPostInclude, {
                post: {
                    include: {
                        favorites: {
                            where: {
                                userId: user.id,
                            },
                            take: 1
                        }
                    }
                }
            }),

        })
        return backSuccessMessage('获取我的收藏列表成功', favorites.data)

    } catch {
        return backFailMessage('获取我的收藏列表失败', {
            list: [],
            totalPages: 0,
            currentPage: 0,
        })
    }

}


/**
 * 切换文章收藏状态
 * @param postId 文章ID
 */
export async function updatePostFavorite(postId: number) {
    try {
        // 1. 检查登录状态
        const user = await checkAuth();
        const userId = user.id;

        if (!userId) return backFailMessage("用户异常", null);

        // 2. 检查是否已经收藏
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        let isLiked = false;

        // 3. 使用事务处理收藏逻辑和数量统计
        await prisma.$transaction(async (tx) => {
            if (existingFavorite) {
                // 如果存在记录，则取消收藏
                await tx.favorite.delete({
                    where: {
                        userId_postId: {
                            userId,
                            postId
                        }
                    }
                });
                // 更新文章的收藏计数字段 (基于你 schema 中的 favoriteCount)
                await tx.post.update({
                    where: {id: postId},
                    data: {favoriteCount: {decrement: 1}}
                });
                isLiked = false;
            } else {
                // 如果不存在记录，则添加收藏
                await tx.favorite.create({
                    data: {
                        userId,
                        postId
                    }
                });
                // 增加文章的收藏计数字段
                await tx.post.update({
                    where: {id: postId},
                    data: {favoriteCount: {increment: 1}}
                });
                isLiked = true;
            }
        });

        return backSuccessMessage(isLiked ? "收藏成功" : "取消收藏成功", isLiked);
    } catch {
        return backFailMessage('收藏操作失败', null)
    }

}

