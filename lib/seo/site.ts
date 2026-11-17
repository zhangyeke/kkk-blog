export const DEFAULT_SITE_URL = "https://kkk-blog-umber.vercel.app"

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

export const SITE_URL = new URL(configuredSiteUrl || DEFAULT_SITE_URL)

if (SITE_URL.protocol !== "https:" && SITE_URL.protocol !== "http:") {
  throw new Error("NEXT_PUBLIC_SITE_URL must use http or https")
}

export function absoluteSiteUrl(path: string): string {
  return new URL(path, SITE_URL).toString()
}

export function articleListPath(options: { categoryId?: number; page?: number } = {}): string {
  const url = new URL("/blog/article/list", SITE_URL)
  if (options.categoryId && options.categoryId > 0) {
    url.searchParams.set("cid", String(options.categoryId))
  }
  if (options.page && options.page > 1) {
    url.searchParams.set("page", String(options.page))
  }
  return `${url.pathname}${url.search}`
}

export function articlePath(id: number): string {
  return `/blog/article/${id}`
}
