'use server';
import {Prisma} from "@prisma/client";
import prisma from '@/lib/prisma'
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
import {PostCategoryWithPosts} from "@/types/postCategory";
import {postWithUserInclude} from "@/types/post";
import {cacheTag} from "next/cache";

export async function createPostCategory() {

}

export async function getPostCategoryList(params?: Prisma.PostCategoryWhereInput) {
    "use cache"
    cacheTag('action-postCategoryList')
    try {
        const where = params ? params : {}
        if (where?.name) {
            where.name = {
                contains: where.name as string,
                mode: 'insensitive'
            }
        }
        const data = await prisma.postCategory.findMany({
            where,
        })
        return backSuccessMessage("获取分类列表成功", data)
    } catch {
        return backFailMessage("获取分类列表失败", [])
    }

}

/*获取文章分类以及关联的所有文章*/
export async function getPostCategoryWithPosts(params?: Prisma.PostCategoryFindManyArgs) {
    try {
        const data = await prisma.postCategory.findMany({
            include: {
                posts: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 6,
                    include: postWithUserInclude
                }
            },
            ...params
        }) as PostCategoryWithPosts[]
        return backSuccessMessage("获取分类列表成功", data)
    } catch {
        return backFailMessage("获取分类列表失败", [])
    }

}

export async function getPostCategoryById(id: string) {

}

export async function updatePostCategory(id: string, data: { title?: string, content?: string }) {

}

export async function deletePostCategory(id: string) {

}