'use server';
import prisma from '@/lib/prisma'; // 导入我们创建的 Prisma Client 实例

// --- CREATE (新增) ---
export async function createPost(data: { title: string, content?: string }) {
    // Omit 'id' or other auto-generated fields
    const { title, content } = data;
    if (!title) {
        throw new Error('Title is required');
    }
    return prisma.post.create({
        data: {
            title,
            content,
        },
    });
}

// --- READ (查询) ---
// 获取所有文章
export async function getAllPosts() {
    return prisma.post.findMany({
        orderBy: {
            createdAt: 'desc', // 按创建时间降序排序
        },
    });
}

// 根据 ID 获取单篇文章
export async function getPostById(id: string) {
    return prisma.post.findUnique({
        where: { id },
    });
}

// --- UPDATE (更新) ---
export async function updatePost(id: string, data: { title?: string, content?: string }) {
    return prisma.post.update({
        where: { id },
        data,
    });
}

// --- DELETE (删除) ---
export async function deletePost(id: string) {
    return prisma.post.delete({
        where: { id },
    });
}