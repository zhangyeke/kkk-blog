'use server';
import prisma from '@/lib/prisma'
import {PostCategory} from "@/types/PostCategory";

export async function createPostCategory() {

}

export async function getPostCategoryList() {
    const data: PostCategory[] = await prisma.postCategory.findMany()
    return data
}

export async function getPostCategoryById(id: string) {

}

export async function updatePostCategory(id: string, data: { title?: string, content?: string }) {

}

export async function deletePostCategory(id: string) {

}