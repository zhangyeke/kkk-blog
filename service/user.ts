'use server';
import {cacheTag, updateTag} from "next/cache";
import prisma from "@/lib/prisma"
import {Prisma} from '@prisma/client'
import {checkAuth} from "@/service/auth";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";
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
    try {
        // 1. 获取当前会话，验证权限
        const session = await checkAuth();
        const user = await prisma.user.findUnique({
            where: {
                id: session.id
            },
            select: {
                avatar: true,
                name: true,
                email: true,
                gender: true,
                birthday: true
            }
        })
        return backSuccessMessage('获取用户信息成功', user)
    } catch {
        return backFailMessage('获取用户信息失败')
    }

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
    try {
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
        updateTag('action-userStatisticsInfo')
        return backSuccessMessage('更新用户信息成功', user)
    } catch (err) {
        return backFailMessage('更新用户信息失败', err)
    }

}

// 查询用户相关统计数据
export async function userStatisticsInfo(id?: string) {
    'use cache'
    cacheTag('action-userStatisticsInfo')
    try {

        const [user, stats] = await Promise.all([
            findUniqueUser({
                id
            }),
            // 查询用户信息（排除密码）

            // 聚合查询：计算该用户发布的所有文章的统计数据
            prisma.post.aggregate({
                where: {
                    userId: id,
                    status: 1, // 建议只统计状态为“正常”的文章，如果是统计全量则去掉此条件
                },
                _count: {
                    id: true, // 文章总数
                },
                _sum: {
                    pv: true, // 所有文章 PV 总和
                    favoriteCount: true, // 所有文章被收藏/点赞总和 (基于你 schema 中的冗余字段)
                }
            })
        ]);
        return backSuccessMessage('获取统计数据成功', {
            ...user,
            statistics: {
                totalPosts: stats._count.id || 0,
                totalPV: stats._sum.pv || 0,
                totalFavorites: stats._sum.favoriteCount || 0,
            }
        })
    } catch {
        return backFailMessage('获取统计数据失败')
    }

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