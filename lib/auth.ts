import NextAuth, {type NextAuthConfig} from "next-auth"
import {PrismaAdapter} from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import {compareSync} from "bcrypt-ts-edge";

import prisma from "./prisma"
import {getUserByEmail, updateUser} from "@/service/user";

const config = {
    pages: {
        signIn: "/login",
        error: "/login",
        signOut: "/"
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 缓存时效： 30 days
    },
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            credentials: {
                email: {
                    type: "emil"
                },
                password: {
                    type: "password"
                }
            },
            async authorize(credentials) {
                if (credentials === null) return null
                // 根据邮箱查询用户
                const user = await getUserByEmail(credentials.email as string)

                // 验证密码
                if (user && user.password) {
                    // 明文密码与加密 密码比对
                    const isMatch = compareSync(credentials.password as string, user.password)
                    if (isMatch) {
                        return user
                    }
                }
                return null
            }
        }),

    ],
    callbacks: {
        async jwt({trigger, token, user}) {
            if (user) {
                token.roles = user.roles
                token.avatar = user.avatar
                /*截取邮箱前缀作为默认名称 */
                if (user.name === 'NO_NAME' && user.email) {
                    token.name = user.email.split('@')[0]
                    /*更新用户名称*/
                    await updateUser(user.id as string, {
                        name: token.name
                    })

                }
            }
            return token
        },
        async session({session, user, token, trigger}) {
            session.user.id = token.sub as string
            session.user.roles = token.roles as string
            session.user.name = token.name
            session.user.avatar = token.avatar as string
            /*同步更新会话中的用户信息*/
            if (trigger === 'update') {
                session.user.name = user.name
            }
            return session
        }
    }

} satisfies NextAuthConfig;

export const {handlers, auth, signOut, signIn} = NextAuth(config)