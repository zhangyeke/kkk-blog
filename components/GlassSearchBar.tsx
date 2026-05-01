"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Search } from "lucide-react"
import React from "react"
import { useClickAway } from "react-use"

import { Image } from "@/components/k-view"
import { cn } from "@/lib/utils"


export const SEARCH_SHORTCUTS = [
  {
    id: "baidu",
    name: "百度",
    icon: "/images/searchIcons/baidu.png",
    href: "https://www.baidu.com",
    searchKey: "/s?wd=",
  },
  {
    id: "google",
    name: "Google",
    icon: "/images/searchIcons/google.png",
    href: "https://www.google.com",
    searchKey: "/search?q=",
  },
  {
    id: "bing",
    name: "必应",
    icon: "/images/searchIcons/bing.png",
    href: "https://www.bing.com",
    searchKey: "/search?q=",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "/images/searchIcons/github.png",
    href: "https://github.com",
    searchKey: "/search?q=",
  },

  {
    id: "npm",
    name: "npm",
    icon: "/images/searchIcons/npm.png",
    href: "https://www.npmjs.com",
    searchKey: "/search?q=",
  },
  {
    id: "stackoverflow",
    name: "Stack Overflow",
    icon: "/images/searchIcons/stackoverflow.png",
    href: "https://stackoverflow.com",
    searchKey: "/search?q=",
  },
  {
    id: "bilibili",
    name: "哔哩哔哩",
    icon: "/images/searchIcons/bilibili.png",
    href: "https://www.bilibili.com",
    searchKey: "https://search.bilibili.com/all?keyword=",
  },
  {
    id: "tiktok",
    name: "抖音",
    icon: "/images/searchIcons/tiktok.png",
    href: "https://www.douyin.com",
    searchKey: "/search/",
  },

  {
    id: "youtube",
    name: "youtube",
    icon: "/images/searchIcons/youtube.png",
    href: "https://www.youtube.com",
    searchKey: "/results?search_query=",
  },

  {
    id: "juejin",
    name: "掘金",
    icon: "/images/searchIcons/juejin.png",
    href: "https://juejin.cn",
    searchKey: "/search?query=",
  },

  {
    id: "zhihu",
    name: "知乎",
    icon: "/images/searchIcons/zhihu.png",
    href: "https://www.zhihu.com",
    searchKey: "/search?q=",
  },
]

export function buildSearchShortcutUrl(item: typeof SEARCH_SHORTCUTS[number], query: string): string {
  const raw = query.trim()
  const q = encodeURIComponent(raw || "")
  if (item.searchKey.startsWith("http")) {
    return `${item.searchKey}=${encodeURIComponent(raw)}`
  }
  const base = item.href.replace(/\/$/, "")

  return `${base}${item.searchKey}${q}`
}


export function SearchList({
  open,
  style,
  className,
  current,
  onChange,
}: BaseComponentProps & {
  open: boolean
  current: number
  onChange: (index: number) => void
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="search-list"
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 28, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={style}
          className={cn("w-full origin-bottom", className)}
          id="search-shortcut-list"
        >
          <div className="columns-3 w-full rounded-lg bg-black/50 p-2">
            {SEARCH_SHORTCUTS.map((item, index) => (
              <div
                className={cn(
                  "mb-1 rounded-lg border-2 border-solid px-[2px] py-[3px]",
                  index === current ? "border-white/50" : "border-transparent",
                )}
                key={index}
                onClick={() => onChange(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onChange(index)
                  }
                }}
              >
                <div className="flex cursor-pointer items-center gap-x-1 rounded-lg bg-white/30 px-4 py-2 text-white hover:bg-white/50">
                  <Image src={item.icon} className="size-5 shrink-0 object-contain" alt="" />
                  <span>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}




type GlassSearchBarProps = {
  className?: string
  /** 占位文案 */
  placeholder?: string
}

/**
 * 毛玻璃胶囊搜索条：半透明底 + backdrop-blur + 细亮边，适合叠在照片/渐变背景上。
 */
export function GlassSearchBar({
  className,
  placeholder = "搜点什么吧",
}: GlassSearchBarProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = React.useState(0)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const searchItem = React.useMemo(() => {
    return SEARCH_SHORTCUTS[current]
  }, [current])

  useClickAway(rootRef, () => {
    setOpen(false)
  })

  const handleCurreChange = (index: number) => {
    setCurrent(index)
    setOpen(false)
  }

  const handleSearch = React.useCallback(() => {
    const item = SEARCH_SHORTCUTS[current]
    if (!item) return
    window.open(buildSearchShortcutUrl(item, query), "_blank", "noopener,noreferrer")
    setQuery("")
  }, [current, query])

  return (
    <motion.div
      ref={rootRef}
      layout
      className={cn("flex w-full flex-col gap-2", className)}
      transition={{
        layout: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
      }}
    >
      <motion.div
        layout="position"
        role="search"
        className={cn(
          "flex h-10 w-full gap-3 rounded-full border border-white/10 bg-black/30 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-200",
          "supports-backdrop-filter:bg-black/25",
        )}
        transition={{ layout: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } }}
      >
        <div
          className="flex h-full cursor-pointer items-center rounded-full px-4 hover:bg-black/25"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="search-shortcut-list"
          aria-label={open ? "收起搜索引擎列表" : "展开搜索引擎列表"}
        >
          <Image
            src={searchItem?.icon}
            className="size-5 shrink-0 object-contain"
            aria-hidden
          />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent  text-center text-base font-normal tracking-wide text-white placeholder:text-white/75 focus:outline-none focus:ring-0"
          aria-label={placeholder}
        />
        <button
          type="button"
          className="flex h-full shrink-0 cursor-pointer items-center rounded-full px-4 text-white transition-colors hover:bg-black/25"
          aria-label={`使用 ${searchItem?.name ?? ""} 搜索`}
          onClick={handleSearch}
        >
          <Search className="size-5" strokeWidth={1.75} aria-hidden />
        </button>
      </motion.div>
      <SearchList open={open} current={current} onChange={handleCurreChange} />
    </motion.div>
  )
}
