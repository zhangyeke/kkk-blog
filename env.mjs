import {createEnv} from "@t3-oss/env-nextjs"
import {z} from "zod"

export const env = createEnv({
    server: {
        ANALYZE: z
            .enum(["true", "false"])
            .optional()
            .transform((value) => value === "true"),
        SUPABASE_URL: z.string().url(),
        SUPABASE_KEY: z.string(),
        SUPABASE_CONNECTION_URL: z.string(),
        API_URL: z.string().url(),
        REQUEST_URL: z.string(),
    },
    client: {
        // 客户端专用环境变量
        NEXT_PUBLIC_ENV: z.enum(["development", "production"]),
    },
    runtimeEnv: {
        // 运行时环境变量（自动从process.env读取）
        // 服务端变量
        REQUEST_URL:process.env.REQUEST_URL,
        API_URL:process.env.API_URL,
        ANALYZE: process.env.ANALYZE,
        SUPABASE_URL:process.env.SUPABASE_URL,
        SUPABASE_KEY:process.env.SUPABASE_KEY,
        SUPABASE_CONNECTION_URL:process.env.SUPABASE_CONNECTION_URL,
        // 客户端变量
        NEXT_PUBLIC_ENV: process.env.NODE_ENV, // 通常客户端环境与服务器一致
    },
})
