'use server';
import prisma from "@/lib/prisma"
import {User} from "@/types/user";

// --- CREATE (新增) ---
export async function createUser(data: Pick<User, 'name' | 'email' | 'password'>) {
    const user: User = await prisma.user.create({
        data
    })
    return user
}

// --- READ (查询) ---
// 获取所有文章
export async function getAllUsers() {

}

// 根据 ID 获取单个
export async function getUserById(id: string) {
    const user: User = await prisma.user.findUnique({
        where: {
            id
        }
    })
    return user
}

// 根据 邮箱 获取单个
export async function getUserByEmail(email: string) {

    const user: User = await prisma.user.findUnique({
        where: {
            email
        }
    })
    return user
}

// --- UPDATE (更新) ---
export async function updateUser(id: string, data: Partial<Omit<User, 'id'>>) {
    const user: User = await prisma.user.update({
        where: {
            id
        },
        data
    })

    return user
}

// --- DELETE (删除) ---
export async function deleteUser(id: string) {
    const user: User = await prisma.user.delete({
        where: {
            id
        },

    })
    return user
}