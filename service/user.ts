'use server';
import prisma from "@/lib/prisma"
import {Prisma} from '@prisma/client'
import {checkAuth, safeAction} from "@/service/auth";
import {backSuccessMessage} from "@/lib/actionMessageBack";
import {revalidatePath} from "next/cache";
import {updateUserSchema} from "@/validators/user";
import {User} from "@/types/user";


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

// 根据 ID 查询单个用户
export async function getUserById(id: string) {
    return await findUniqueUser({
        id
    })
}

/*获取自己的用户信息*/
export async function getMeInfo() {
    return safeAction(async () => {
        // 1. 获取当前会话，验证权限
        const session = await checkAuth();
        const user = await prisma.user.findUnique({
            where: {
                id: session.id
            },
            select: {
                avatar: true,
                name: true,
                email: true
            }
        })
        return backSuccessMessage('获取用户信息成功', user)
    }, '获取用户信息失败')
}


// 根据 邮箱 查询单个用户
export async function getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
        where: {
            email
        },

    })

    return user
}

// --- UPDATE (更新) ---
export async function updateUser(params: Prisma.UserUpdateInput) {

    return safeAction(async () => {
        const data = updateUserSchema.parse(params)
        // // 1. 获取当前会话，验证权限
        const session = await checkAuth();
        const user = await prisma.user.update({
            where: {
                id: session?.id
            },
            omit: {
                password: true
            },
            data
        })

        return backSuccessMessage('更新用户信息成功', user)
    }, '更新用户信息失败')
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