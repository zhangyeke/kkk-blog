'use server';
import {Prisma} from "@prisma/client";
import prisma from '@/lib/prisma'
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";

export async function createPostCategory() {

}

export async function getPostCategoryList(params?: Prisma.PostCategoryWhereInput) {
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
    } catch (err) {
        console.log("什么错误", err)
        return Promise.reject(backFailMessage("获取分类列表失败", []))
    }

}

export async function getPostCategoryById(id: string) {

}

export async function updatePostCategory(id: string, data: { title?: string, content?: string }) {

}

export async function deletePostCategory(id: string) {

}