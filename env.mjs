import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
  },
  client: {
    // 客户端专用环境变量
    NEXT_PUBLIC_ENV: z.enum(["development", "production"]),
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    // 运行时环境变量（自动从process.env读取）
    // 服务端变量
    ANALYZE: process.env.ANALYZE,
    // 客户端变量
    NEXT_PUBLIC_API_URL:"https://admin.zhengtuqicheng.top",
    NEXT_PUBLIC_ENV: process.env.NODE_ENV, // 通常客户端环境与服务器一致
  },
})
