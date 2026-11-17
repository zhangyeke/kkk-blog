import type { Metadata } from "next"
import { createPublicPageMetadata } from "@/lib/seo/metadata"
import { BLOG_PAGE_KEYS, requireBlogPageAccess } from "@/lib/blog/permissions"

const atlasUrl = "https://deanchen.me/jiangshan-map/"

export const metadata: Metadata = createPublicPageMetadata({
  title: "江山时序",
  description: "通过交互地图和时间轴，查看战国至今的疆域变迁、古今地名与历史事件。",
  path: "/blog/jiangshan-map",
})

export default async function JiangshanMapPage() {
  await requireBlogPageAccess(BLOG_PAGE_KEYS.jiangshanMap)
  return (
    <section className="flex h-dvh w-full flex-col pt-15">
      <iframe
        src={atlasUrl}
        title="江山时序中国历史交互地图"
        referrerPolicy="no-referrer"
        allow="fullscreen"
        className="block min-h-0 w-full flex-1 border-0 bg-[#f4ecd9]"
      />
    </section>
  )
}
