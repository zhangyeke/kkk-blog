import {createEnv} from "@t3-oss/env-nextjs"
import {z} from "zod"

export const env = createEnv({
    server: {
        ANALYZE: z
            .enum(["true", "false"])
            .optional()
            .transform((value) => value === "true"),
        AL_API_TOKEN: z.string(),
        AL_API_URL:z.string().url(),
        // API_URL: z.string().url(),
        // REQUEST_URL: z.string(),
    },
    client: {
        // 客户端专用环境变量
        NEXT_PUBLIC_ENV: z.enum(["development", "production"]),
        NEXT_PUBLIC_API_URL: z.string(),
        NEXT_PUBLIC_REQUEST_URL: z.string(),
        NEXT_PUBLIC_STORAGE_NAME: z.string()
    },
    runtimeEnv: {
        // 运行时环境变量（自动从process.env读取）
        // 服务端变量
        REQUEST_URL: process.env.REQUEST_URL,
        API_URL: process.env.API_URL,
        ANALYZE: process.env.ANALYZE,
        AL_API_TOKEN:process.env.AL_API_TOKEN,
        AL_API_URL:process.env.AL_API_URL,
        // 客户端变量
        NEXT_PUBLIC_ENV: process.env.NODE_ENV, // 通常客户端环境与服务器一致
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_REQUEST_URL: process.env.NEXT_PUBLIC_REQUEST_URL,
        NEXT_PUBLIC_STORAGE_NAME: process.env.NEXT_PUBLIC_STORAGE_NAME,
    },
})
