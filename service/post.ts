'use server';
import {Post, Prisma} from '@prisma/client'
import prisma from "@/lib/prisma";
import {addPostParams} from "@/types/post";
import {auth} from "@/lib/auth"
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";

// --- CREATE (新增) ---
export async function createPost(data: addPostParams) {
    try {
        const session = await auth()
        if (session && session.user) {
            const post: Post = await prisma.post.create({
                data: {
                    ...data,
                    userId: session.user.id || ''
                }
            })
            return backSuccessMessage("创建文章成功", post)
        }
    } catch (err) {
        return Promise.reject(backFailMessage("创建文章失败", err))
    }

}

// --- READ (查询) ---
// 获取所有文章
export async function getAllPosts() {

}

// 根据 ID 获取单篇文章
export async function getPostById(id: string) {

}

// --- UPDATE (更新) ---
export async function updatePost(id: string, data: { title?: string, content?: string }) {

}

// --- DELETE (删除) ---
export async function deletePost(id: string) {

}