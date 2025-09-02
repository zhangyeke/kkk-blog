import withBundleAnalyzer from "@next/bundle-analyzer"
import createMDX from '@next/mdx'
import {type NextConfig} from "next"
import {env} from "./env.mjs"

const withMDX = createMDX({
    extension: /\.(md|mdx)$/,
    options: {}
})

const config: NextConfig = {

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
