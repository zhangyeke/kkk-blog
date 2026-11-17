import type { Metadata } from "next"
import Link from "next/link"

import { requirePageAccess, scopeOf } from "@/lib/admin/guard"
import { formatRelative } from "@/lib/date"
import { cn } from "@/lib/ui/cn"
import { getAdminOverview } from "@/service/admin/overview"
import { CountUp } from "./components/CountUp"
import { Empty } from "@/components/k-view/Empty"

export const metadata: Metadata = { title: "概览" }

/** 数据实时变化，不做静态缓存 */
export const dynamic = "force-dynamic"

const RING_R = 43
const RING_C = 2 * Math.PI * RING_R
const formatOverviewNumber = (value: number | null | undefined) => (value ?? 0).toLocaleString("en-US")

export default async function AdminOverviewPage() {
  const user = await requirePageAccess("dashboard")
  const scope = scopeOf(user)
  const result = await getAdminOverview(scope)
  const data = result.code === 200 ? result.data : null

  if (!data) {
    return <Empty className="mt-[10%]" imageClass="lg:size-75"/>
  }

  const postTotal = data.postTotal
  const published = data.postPublished
  const ratio = postTotal > 0 ? published / postTotal : 0
  const dashOffset = RING_C * (1 - ratio)

  const stats = [
    { cap: "文章总数", value: postTotal, note: `已发布 ${published} · 草稿 ${data.postDraft}` },
    { cap: "总浏览", value: data.viewTotal, note: "累计" },
    { cap: "被收藏", value: data.favoriteTotal, note: "文章收藏合计" },
    { cap: "书签总数", value: data.bookmarkTotal, note: "已收录链接" },
    { cap: "足迹地点", value: data.footprintTotal, note: "地点记录" },
  ]

  return (
    <div className="mx-auto w-full max-w-[1600px]">
      {/* Hero：发布进度环 */}
      <section
        className="adm-rise mb-4 flex flex-wrap items-center gap-6 rounded-xl border p-5 sm:p-6"
        style={{
          ["--i" as string]: 1,
          borderColor: "var(--adm-line)",
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--adm-c1) 9%, var(--adm-paper-2)), var(--adm-paper-2) 62%)",
        }}
      >
        <div className="relative size-[104px] shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90">
            <circle cx="50" cy="50" r={RING_R} fill="none" stroke="var(--adm-line)" strokeWidth="6" />
            <circle
              className="adm-ring-arc"
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke="var(--adm-c2)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="adm-serif text-xl leading-none md:text-2xl" style={{ color: "var(--adm-ink)" }}>
                <CountUp value={Math.round(ratio * 100)} suffix="%" />
              </div>
              <div
                className="mt-1 text-[8px] leading-none tracking-[0.1em] sm:text-[9px] md:text-[10px]"
                style={{ color: "var(--adm-ink-3)" }}
              >
                PUBLISHED
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs tracking-[0.22em] md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
            PUBLISHING STATUS
          </div>
          <div className="adm-serif mt-1.5 text-xl md:text-2xl" style={{ color: "var(--adm-ink)" }}>
            {postTotal === 0 ? "还没有文章" : `已发布 ${published} 篇`}
          </div>
          <div
            className="adm-serif mt-2 inline-block text-sm italic md:text-base"
            style={{ color: "var(--adm-c2)", transform: "rotate(-2deg)" }}
          >
            {postTotal === 0 ? "写一篇，就开始了。" : "保持节奏，继续写下去。"}
          </div>
        </div>

        <dl className="flex w-full flex-wrap gap-x-7 gap-y-3 sm:w-auto">
          {[
            { dt: "文章", dd: postTotal },
            { dt: "草稿", dd: data.postDraft },
            { dt: "浏览", dd: data.viewTotal },
          ].map((item) => (
            <div key={item.dt} className="text-right">
              <dt className="text-xs tracking-[0.14em] md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
                {item.dt}
              </dt>
              <dd className="adm-serif mt-0.5 text-lg tabular-nums md:text-xl" style={{ color: "var(--adm-ink)" }}>
                <CountUp value={item.dd} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 指标卡 */}
      <section className="mb-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat, index) => (
          <div
            key={stat.cap}
            className="adm-rise rounded-lg border p-4"
            style={{
              ["--i" as string]: index + 2,
              borderColor: "var(--adm-line)",
              background: "var(--adm-paper-2)",
            }}
          >
            <div className="text-xs tracking-[0.16em] md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
              {stat.cap}
            </div>
            <div
              className="adm-serif mt-2 text-2xl leading-none tabular-nums md:text-3xl"
              style={{ color: "var(--adm-ink)" }}
            >
              <CountUp value={stat.value} />
            </div>
            <div className="mt-2 text-xs md:text-sm" style={{ color: "var(--adm-ink-3)" }}>
              {stat.note}
            </div>
          </div>
        ))}
      </section>

      {/* 热门内容与最新足迹 */}
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        <section
          className="adm-rise overflow-hidden rounded-lg border"
          style={{
            ["--i" as string]: 7,
            borderColor: "var(--adm-line)",
            background: "var(--adm-paper-2)",
          }}
        >
          <header className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--adm-line-2)" }}>
            <span className="adm-serif text-base md:text-lg" style={{ color: "var(--adm-ink)" }}>
              热门文章
            </span>
            <span className="text-xs" style={{ color: "var(--adm-ink-3)" }}>
              按浏览量
            </span>
            <Link
              href="/admin/posts"
              className="ml-auto text-xs transition-opacity hover:opacity-70 md:text-sm"
              style={{ color: "var(--adm-ink-3)" }}
            >
              全部 →
            </Link>
          </header>

          {data.topPosts.length > 0 ? (
            <ul>
              {data.topPosts.map((post, index) => (
                <li key={post.id} className="border-b last:border-0" style={{ borderColor: "var(--adm-line-2)" }}>
                  <Link
                    href={`/blog/article/${post.id}`}
                    className="group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--adm-paper-3)] focus-visible:outline-2 focus-visible:outline-[var(--adm-c1)]"
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums"
                      style={{ background: "var(--adm-paper-3)", color: "var(--adm-ink-3)" }}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[var(--adm-ink)] group-hover:text-[var(--adm-c1)] md:text-base">
                        {post.title || "未命名文章"}
                      </span>
                      <span className="mt-0.5 block text-xs" style={{ color: "var(--adm-ink-3)" }}>
                        {formatRelative(post.updatedAt)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="adm-serif block text-base tabular-nums" style={{ color: "var(--adm-ink-2)" }}>
                        {formatOverviewNumber(post.pv)}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--adm-ink-3)" }}>
                        浏览
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              type="news"
              text="还没有已发布文章"
              description="发布文章后会按浏览量显示在这里"
              imageClass="size-16"
              className="px-4 py-8"
            />
          )}
        </section>

        <section
          className="adm-rise overflow-hidden rounded-lg border"
          style={{
            ["--i" as string]: 8,
            borderColor: "var(--adm-line)",
            background: "var(--adm-paper-2)",
          }}
        >
          <header className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--adm-line-2)" }}>
            <span className="adm-serif text-base md:text-lg" style={{ color: "var(--adm-ink)" }}>
              热门书签
            </span>
            <span className="text-xs" style={{ color: "var(--adm-ink-3)" }}>
              按点击量
            </span>
            <Link
              href="/admin/bookmarks"
              className="ml-auto text-xs transition-opacity hover:opacity-70 md:text-sm"
              style={{ color: "var(--adm-ink-3)" }}
            >
              全部 →
            </Link>
          </header>

          {!data.bookmarkClicksAvailable ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm" style={{ color: "var(--adm-ink-2)" }}>
                点击量统计暂不可用
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--adm-ink-3)" }}>
                请先执行书签点击量 SQL，再刷新概览
              </p>
            </div>
          ) : data.topBookmarks.length > 0 ? (
            <ul>
              {data.topBookmarks.map((bookmark, index) => {
                const intro = bookmark.intro?.trim()

                return (
                  <li key={bookmark.id} className="border-b last:border-0" style={{ borderColor: "var(--adm-line-2)" }}>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "group flex items-center min-w-0 gap-3 px-4 py-3 transition-colors hover:bg-[var(--adm-paper-3)] focus-visible:outline-2 focus-visible:outline-[var(--adm-c1)]",

                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs tabular-nums",
                          intro && "mt-0.5"
                        )}
                        style={{ background: "var(--adm-paper-3)", color: "var(--adm-ink-3)" }}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-[var(--adm-ink)] group-hover:text-[var(--adm-c1)] md:text-base">
                          {bookmark.title || "未命名书签"}
                        </span>
                        {intro && (
                          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--adm-ink-3)] md:text-sm">
                            {intro}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="adm-serif block text-base tabular-nums" style={{ color: "var(--adm-ink-2)" }}>
                          {formatOverviewNumber(bookmark.clickCount)}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--adm-ink-3)" }}>
                          点击
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty
              type="list"
              text="还没有启用的书签"
              description="书签被点击后会累计点击量"
              imageClass="size-16"
              className="px-4 py-8"
            />
          )}
        </section>

        <section
          className="adm-rise overflow-hidden rounded-lg border"
          style={{
            ["--i" as string]: 9,
            borderColor: "var(--adm-line)",
            background: "var(--adm-paper-2)",
          }}
        >
          <header className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--adm-line-2)" }}>
            <span className="adm-serif text-base md:text-lg" style={{ color: "var(--adm-ink)" }}>
              最新足迹地点
            </span>
            <Link
              href="/admin/footprints"
              className="ml-auto text-xs transition-opacity hover:opacity-70 md:text-sm"
              style={{ color: "var(--adm-ink-3)" }}
            >
              全部 →
            </Link>
          </header>

          {data.recentFootprints.length > 0 ? (
            <ul>
              {data.recentFootprints.map((footprint) => (
                <li
                  key={footprint.id}
                  className="flex min-w-0 items-center gap-3 border-b px-4 py-3 last:border-0"
                  style={{ borderColor: "var(--adm-line-2)" }}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: "var(--adm-c2)" }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm md:text-base" style={{ color: "var(--adm-ink)" }}>
                      {footprint.address?.trim() || "未命名地点"}
                    </span>
                    <span className="mt-0.5 block text-xs" style={{ color: "var(--adm-ink-3)" }}>
                      {footprint.photoCount > 0 ? `${footprint.photoCount} 张照片` : "暂无照片"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--adm-ink-3)" }}>
                    {formatRelative(footprint.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              type="address"
              text="还没有足迹记录"
              description="新增地点后会显示在这里"
              imageClass="size-16"
              className="px-4 py-8"
            />
          )}
        </section>
      </div>
    </div>
  )
}
