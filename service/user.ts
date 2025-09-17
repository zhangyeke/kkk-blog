'use server';
import prisma from "@/lib/prisma"
import {Prisma, User} from '@prisma/client'
// import {User} from "@/types/user";


// --- CREATE (新增) ---
export async function createUser(data: Prisma.UserCreateInput) {
    const user: User = await prisma.user.create({
        data
    })
    return user
}

// --- READ (查询) ---
// 获取所有
export async function getAllUsers() {

}

/*获取单个用户*/
export async function findUniqueUser(where: Prisma.UserWhereUniqueInput) {
    const user = await prisma.user.findUnique({
        where,
        omit: {
            password: true
        }
    })
    return user
}

// 根据 ID 获取单个
export async function getUserById(id: string) {
    return await findUniqueUser({
        id
    })
}

// 根据 邮箱 获取单个
export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: {
            email
        },

    })

    return user
}

// --- UPDATE (更新) ---
export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
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