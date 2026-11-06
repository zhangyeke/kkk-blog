/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-04 19:28:17
 * @FilePath: \blog\next.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import withBundleAnalyzer from "@next/bundle-analyzer"
import createMDX from "@next/mdx"
import { type NextConfig } from "next"
import { imageUploadLimitBytes } from "./lib/image-upload-policy"

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {},
})

const config: NextConfig = {
  // Allow isolated local builds without touching another running server's output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1", "192.168.2.235"],
  transpilePackages: ["next-mdx-remote"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.bmp.ovh",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
      {
        protocol: "https",
        hostname: "eo-img.loliapi.com",
        port: "",
        pathname: "/**", // 允许该域名下的所有路径
      },
    ],
  },
  experimental: {
    serverActions: {
      // File limit plus room for multipart fields and boundaries.
      bodySizeLimit: imageUploadLimitBytes(process.env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT || "10mb") + 512 * 1024,
    },
  },
  // 配置‘ pageExtensions ’以包含markdown和MDX文件
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/blog",
        permanent: true, // 或者 false，取决于你是否希望这是永久重定向
      },
    ]
  },
  rewrites: async () => [
    // {source: "/shopapi/:path*", destination: "https://admin.zhengtuqicheng.top/shopapi/:path*"},
  ],
}

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer({ enabled: true, openAnalyzer: false })(withMDX(config))
  : withMDX(config)
