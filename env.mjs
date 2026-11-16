/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-04 19:04:48
 * @FilePath: \blog\env.mjs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {createEnv} from "@t3-oss/env-nextjs"
import {z} from "zod"

export const env = createEnv({
    server: {
        ANALYZE: z
            .enum(["true", "false"])
            .optional()
            .transform((value) => value === "true"),
        MATERIAL_API_TOKEN: z.string(),
        MATERIAL_API_URL: z.string().url(),
        IMGBB_API_TOKEN: z.string(),
        IMGBB_API_URL: z.string().url(),
        /** 备用图床主节点上传地址，具体值写在 .env.development / .env.production */
        MTBED_UPLOAD_URL_PRIMARY: z.string().url(),
        /** 备用图床备节点上传地址，具体值写在 .env.development / .env.production */
        MTBED_UPLOAD_URL_SECONDARY: z.string().url(),
        AUTH_GITHUB_ID: z.string(),
        AUTH_GITHUB_SECRET: z.string(),
        AUTH_GOOGLE_ID: z.string(),
        AUTH_GOOGLE_SECRET: z.string(),
        // 默认海外线路，便于 Vercel 等境外节点访问；本地可设 AL_API_URL=https://v1.hitokoto.cn
        AL_API_URL: z.preprocess(
            (v) =>
                typeof v === "string" && v.trim() !== ""
                    ? v.trim()
                    : "https://v1.hitokoto.cn",
            z.string().url()
        ),
        POEM_API_URL: z.string().url(),
        MAP_BASE_URL: z.string().url(),
        /**
         * 高德 JS API key。**服务端变量**：不加 NEXT_PUBLIC_ 前缀，
         * 由 Server Component 读出后作为 prop 传给客户端地图组件，
         * 因此不会编译进客户端 bundle，也不会进 git。
         * 设为 optional：缺 key 时页面显示配置提示，而不是构建失败。
         */
        GAODI_MAP_KEY: z.string().optional(),
        /** 高德 Web 服务 API key，用于服务端地址地理编码；不要使用 NEXT_PUBLIC_ 前缀 */
        GAODI_WEB_SERVICE_KEY: z.string().optional(),
        /** 高德 JS API 2.0 安全密钥（可选）。配置后需在加载脚本前注入 _AMapSecurityConfig */
        GAODI_SECURITY_CODE: z.string().optional(),
        /**
         * 高德自定义地图样式 ID（可选）。填了就切回矢量底图并用该样式，
         * 不再叠卫星影像。格式：`amap://styles/xxxxxx` 或纯 ID。
         * 只有自定义样式能同时做到「蔚蓝海水 + 绿土陆地」。
         */
        GAODI_MAP_STYLE: z.string().optional(),
        // API_URL: z.string().url(),
        // REQUEST_URL: z.string(),
    },
    client: {
        // 客户端专用环境变量
        NEXT_PUBLIC_ENV: z.enum(["development", "production"]),
        NEXT_PUBLIC_API_URL: z.string(),
        NEXT_PUBLIC_REQUEST_URL: z.string(),
        NEXT_PUBLIC_STORAGE_NAME: z.string(),
        NEXT_PUBLIC_IMG_UPLOAD_LIMIT: z.string(),
        NEXT_PUBLIC_RANDOM_IMAGE_URL_1: z.string(),
        NEXT_PUBLIC_RANDOM_IMAGE_URL_2: z.string(),
    },
    runtimeEnv: {
        // 运行时环境变量（自动从process.env读取）
        // 服务端变量
        REQUEST_URL: process.env.REQUEST_URL,
        API_URL: process.env.API_URL,
        ANALYZE: process.env.ANALYZE,
        MATERIAL_API_TOKEN: process.env.MATERIAL_API_TOKEN,
        MATERIAL_API_URL: process.env.MATERIAL_API_URL,
        AL_API_URL: process.env.AL_API_URL,
        POEM_API_URL: process.env.POEM_API_URL,
        MAP_BASE_URL: process.env.MAP_BASE_URL,
        GAODI_MAP_KEY: process.env.GAODI_MAP_KEY,
        GAODI_WEB_SERVICE_KEY: process.env.GAODI_WEB_SERVICE_KEY,
        GAODI_SECURITY_CODE: process.env.GAODI_SECURITY_CODE,
        GAODI_MAP_STYLE: process.env.GAODI_MAP_STYLE,
        IMGBB_API_TOKEN: process.env.IMGBB_API_TOKEN,
        IMGBB_API_URL: process.env.IMGBB_API_URL,
        MTBED_UPLOAD_URL_PRIMARY: process.env.MTBED_UPLOAD_URL_PRIMARY,
        MTBED_UPLOAD_URL_SECONDARY: process.env.MTBED_UPLOAD_URL_SECONDARY,
        AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
        AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
        AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
        AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
        // 客户端变量
        NEXT_PUBLIC_ENV: process.env.NODE_ENV, // 通常客户端环境与服务器一致
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_REQUEST_URL: process.env.NEXT_PUBLIC_REQUEST_URL,
        NEXT_PUBLIC_STORAGE_NAME: process.env.NEXT_PUBLIC_STORAGE_NAME,
        NEXT_PUBLIC_IMG_UPLOAD_LIMIT: process.env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT,
        NEXT_PUBLIC_RANDOM_IMAGE_URL_1: process.env.NEXT_PUBLIC_RANDOM_IMAGE_URL_1,
        NEXT_PUBLIC_RANDOM_IMAGE_URL_2: process.env.NEXT_PUBLIC_RANDOM_IMAGE_URL_2,
    },
})
