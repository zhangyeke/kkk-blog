import type { User } from "@prisma/client"
import type { DefaultSession } from "next-auth"

/**
 * 从 Prisma User 中挑出放进 session 的字段；Prisma 模型变更时此处会自动跟随。
 * 不要把 password、address 等敏感或大字段放进 session。
 */
type SessionUserFromPrisma = User

/**
 * NextAuth 默认 user 带 name / email / image 等；与 Prisma 字段做交叉后全局使用。
 * 若需导出到业务代码：`import type { AppSessionUser } from "@/types/next-auth"`
 */
export type AppSessionUser = SessionUserFromPrisma & DefaultSession["user"]

declare module "next-auth" {
  interface Session {
    user: AppSessionUser
  }
}

declare module "next-auth/jwt" {
  /** jwt callback 里从 user / session 合并进 token 的字段，与 Prisma 对齐 */
  interface JWT extends Partial<SessionUserFromPrisma> {}
}
