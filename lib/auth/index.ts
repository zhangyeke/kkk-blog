import NextAuth, { type NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { env } from "@/env.mjs"
import { prismaAuthAdapter } from "./prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { compareSync } from "bcrypt-ts-edge"

import prisma from "@/lib/prisma"
import { getUserByEmail, updateUser } from "@/service/user"

const config = {
  /** Auth.js v5：允许根据请求的 Host（如 localhost、Vercel 域名）生成 URL，否则会抛 UntrustedHost */
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 缓存时效： 30 days
  },
  adapter: prismaAuthAdapter(prisma),
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      credentials: {
        email: {
          type: "text",
        },
        password: {
          type: "password",
        },
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
      },
    }),
  ],
  callbacks: {
    async jwt({ trigger, token, user, session }) {
      if (user) {
        token = {
          ...token,
          sub: user.id,
          name: user.name,
          email: user.email,
          roles: "roles" in user ? user.roles : "user",
        }
        const profileImage = "image" in user && typeof user.image === "string" ? user.image : undefined
        const profileAvatar = "avatar" in user && typeof user.avatar === "string" ? user.avatar : undefined
        if (profileImage != null && profileImage.length > 0) {
          token.avatar = profileImage
        } else if (profileAvatar != null && profileAvatar.length > 0) {
          token.avatar = profileAvatar
        }

        /*截取邮箱前缀作为默认名称 */
        if (user.name === "NO_NAME" && user.email) {
          token.name = user.email.split("@")[0]
          /*更新用户名称*/
          await updateUser({
            name: token.name,
          })
        }
      }

      if (trigger === "update" && session) {
        const result = await updateUser(session.user)
        if (result.code === 200 && result.data) {
          token = {
            ...token,
            name: result.data.name,
            avatar: result.data.avatar,
            email: result.data.email,
          }
        }
      }
      return token
    },
    async session({ session, user, token, trigger }) {
      const newUser = {
        id: token.sub,
        roles: token.roles,
        name: token.name,
        avatar: (token.avatar as string | undefined) ?? (token.image as string | undefined),
      } as AnyObject

      session.user = {
        ...session.user,
        ...newUser,
      }
      /*同步更新会话中的用户信息*/
      if (trigger === "update" && user?.name != null) {
        session.user.name = user.name
      }
      return session
    },
  },
} satisfies NextAuthConfig

const authInstance = NextAuth(config)
export const { handlers, signOut, signIn, unstable_update } = authInstance

/** Auth.js may return an error JSON object when configuration is invalid. */
export async function auth() {
  const session = await authInstance.auth()
  return session?.user?.id ? session : null
}
