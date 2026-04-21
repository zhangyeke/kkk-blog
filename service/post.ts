'use server';
import {merge} from "lodash"
import {Prisma} from '@prisma/client'
import prisma from "@/lib/prisma";
import {addPostParams, PostWithUser, postWithUserInclude} from "@/types/post";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
import {checkAuth, safeAction} from "@/service/auth";
import {revalidatePath} from 'next/cache'
import {addPostSchema} from "@/validators/post";
import {getPlainText} from "@/lib/utils";

// --- CREATE (新增) ---
export async function createPost(data: addPostParams) {
    return safeAction(async () => {
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
        revalidatePath('/blog');
        return backSuccessMessage("创建文章成功", post);
    }, "创建文章失败");

}

// --- READ (查询) ---
// 获取所有文章
export async function getAllPosts(params?: Prisma.PostFindManyArgs) {
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
        return backFailMessage("获取文章列表失败", []);
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
        });

    }

}


// 根据 ID 获取单篇文章
export async function getPostById(id: number) {
    try {
        const post = await prisma.post.update({
            where: {id},
            data: {
                pv: {
                    increment: 1 // 原子自增 1
                }
            },
            include: postWithUserInclude // 依然可以直接包含关联数据
        }) as PostWithUser;
        // revalidatePath('/blog');
        return backSuccessMessage('获取文章成功', post)
    } catch {
        return backFailMessage('文章不存在', null)
    }

}

// --- UPDATE (更新) ---
export async function updatePost(id: string, data: { title?: string, content?: string }) {

}

// --- DELETE (删除) ---
export async function deletePost(id: string) {

}