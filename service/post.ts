'use server';
import {merge} from "lodash"
import {cacheTag, updateTag} from "next/cache";
import {Prisma} from '@prisma/client'
import prisma from "@/lib/prisma";
import {addPostParams, PostWithFavorites, PostWithUser, postWithUserInclude} from "@/types/post";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
import {checkAuth} from "@/service/auth";
import {addPostSchema} from "@/validators/post";
import {getPlainText} from "@/lib/utils";
import {after} from "next/server";
import {auth} from "@/lib/auth";

// --- CREATE (新增) ---
export async function createPost(data: addPostParams) {
    try {
        // 1. 拦截未登录（抛出 ActionError）
        const user = await checkAuth();
        const params = addPostSchema.parse(data)

        // 2. 数据库操作（如果失败会抛出 Prisma 错误）
        const post = await prisma.post.create({
            data: {
                ...params,
                userId: user.id || ''
            }
        });

        updateTag('action-postList')
        return backSuccessMessage("创建文章成功", post);
    } catch {
        return backFailMessage('创建文章失败')
    }


}

// --- READ (查询) ---
// 获取所有文章
export async function getAllPosts(params?: Prisma.PostFindManyArgs) {
    "use cache"
    cacheTag('action-postList')
    try {
        const posts = await prisma.post.findMany({
            include: postWithUserInclude,
            ...params
        })

        const postsWithSummary = await Promise.all(
            posts.map(async (post) => {
                return {
                    ...post,
                    // 增加一个 summary 字段
                    summary: await getPlainText(post.content || "")
                }
            })
        ) as PostWithUser[]
        return backSuccessMessage("获取文章列表成功", postsWithSummary);
    } catch {
        return backFailMessage("获取文章列表失败", [])
    }
}

/*获取函数的返回值类型*/
// export type GetAllPostsResponse = Awaited<ReturnType<typeof getAllPosts>>;

/*分页查询文章*/
export async function getPostsByPage(params: Prisma.PostFindManyArgs & Paging) {

    try {
        const {page, pageSize, ...data} = params

        const posts = await getAllPosts({
            ...merge({
                // orderBy: {createdAt: 'desc'},
                where: {
                    status: 1,
                }
            }, data),
            skip: (page - 1) * pageSize, // 跳过前面的页数
            take: pageSize,             // 每页查多少条
        });

        // 通常还需要返回总数来计算总页数
        const totalCount = await prisma.post.count();
        return backSuccessMessage("获取文章列表成功", {
            list: posts.data,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
        })
    } catch {
        return backFailMessage("获取文章列表失败", {
            list: [],
            totalPages: 0,
            currentPage: 0,
        })

    }

}


// --- UPDATE (更新) ---
export async function updatePost(id: number, params: Prisma.PostUpdateInput) {
    try {
        const post = await prisma.post.update({
            where: {id},
            data: params
        });
        updateTag('action-postList')
        return backSuccessMessage('更新文章成功', post)
    } catch {
        return backFailMessage('更新文章失败')
    }
}


// 根据 ID 获取单篇文章
export async function getPostById(id: number) {

    try {
        // 1. 获取当前登录用户会话
        const session = await auth();
        const currentUserId = session?.user?.id;

        const post = await prisma.post.findUnique({
            where: {id},
            include: {
                ...postWithUserInclude,
                // 如果用户已登录，我们尝试查一下他是否收藏了这篇文章
                favorites: currentUserId ? {
                    where: {
                        userId: currentUserId
                    },
                    take: 1
                } : false
            }
        }) as PostWithFavorites;

        // 为了保持 PostWithUser 类型的整洁，我们可以解构掉 favorites
        const {favorites, ...postData} = post;
        // 如果 favorites 数组长度大于 0，说明当前用户已收藏
        const isFavorite = Array.isArray(favorites) && favorites.length > 0;

        after(async () => {
            await updatePost(id, {
                pv: {increment: 1}
            })
            updateTag('action-userStatisticsInfo')
        });

        return backSuccessMessage('获取文章成功', {
            ...postData,
            isFavorite
        } as PostWithFavorites & { isFavorite: boolean })
    } catch {
        return backFailMessage('文章不存在')
    }

}


// --- DELETE (删除) ---
export async function deletePost(postId: number) {
    try {

        if (!Number.isInteger(postId) || postId <= 0) {
            return backFailMessage('文章 ID 不合法');
        }

        const user = await checkAuth();

        const post = await prisma.post.findUnique({
            where: {id: postId},
            select: {
                id: true,
                userId: true,
            }
        });

        if (!post) {
            return backFailMessage('文章不存在');
        }

        if (post.userId !== user.id) {
            return backFailMessage('无权删除这篇文章');
        }

        const deletedPost = await prisma.post.delete({
            where: {id: postId}
        });

        updateTag('action-postList');
        updateTag('action-postDetail');
        updateTag('action-userStatisticsInfo');

        return backSuccessMessage('删除文章成功', deletedPost);
    } catch {
        return backFailMessage('删除文章失败');
    }
}
