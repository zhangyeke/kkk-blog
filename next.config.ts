import withBundleAnalyzer from "@next/bundle-analyzer"
import createMDX from '@next/mdx'
import {type NextConfig, SizeLimit} from "next"
import {env} from "./env.mjs"

const withMDX = createMDX({
    extension: /\.(md|mdx)$/,
    options: {}
})

const config: NextConfig = {
    cacheComponents: true,//开启可以使用 use cache 来缓存数据或组件
    transpilePackages: ['next-mdx-remote'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 's3.bmp.ovh',
                port: '',
                pathname: '/**', // 允许该域名下的所有路径
            },

        ],
    },
    experimental: {
        serverActions: {
            // 设置为您需要的限制，例如 10MB 或 50MB
            bodySizeLimit: env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT as SizeLimit
        },
    },
    // 配置‘ pageExtensions ’以包含markdown和MDX文件
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    reactStrictMode: true,
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    async redirects() {
        return [
            {
                source: '/',
                destination: '/blog',
                permanent: true, // 或者 false，取决于你是否希望这是永久重定向
            },
        ]
    }
    ,
    rewrites: async () => [
        // {source: "/shopapi/:path*", destination: "https://admin.zhengtuqicheng.top/shopapi/:path*"},
    ],
}

export default env.ANALYZE ? withBundleAnalyzer({enabled: env.ANALYZE})(withMDX(config)) : withMDX(config)
