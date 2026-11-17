"use client"

import { ChevronDown, Search } from "lucide-react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import React from "react"
import { useClickAway } from "react-use"

import { Image } from "@/components/k-view/Image"
import { cn } from "@/lib/ui/cn"
import styles from "./GlassSearchBar.module.css"

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

export function buildSearchShortcutUrl(item: (typeof SEARCH_SHORTCUTS)[number], query: string): string {
  const raw = query.trim()
  const q = encodeURIComponent(raw || "")
  const base = item.href.replace(/\/$/, "")
  if (!raw) return base
  if (item.searchKey.startsWith("http")) {
    return `${item.searchKey}${encodeURIComponent(raw)}`
  }

  return `${base}${item.searchKey}${q}`
}

/**
 * 一次成型的「玻璃片展开」：面板像一块玻璃从搜索条后方掀开——
 * 绕顶边微微前倾（rotateX -8°）后落平，圆角同时从胶囊感的 1.75rem 收成卡片圆角。
 * 缩放/位移/倾角走弹簧；模糊与圆角单独走缓动，避免弹簧作用在 blur 上产生的抖动。
 * 列表项刻意不做逐项入场——那是通用模板的写法，这里让整块材质一次到位。
 */
const PANEL_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.94,
    rotateX: -8,
    filter: "blur(10px)",
    borderRadius: "1.75rem",
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    borderRadius: "0.75rem",
    transition: {
      type: "spring",
      stiffness: 360,
      damping: 30,
      mass: 0.9,
      opacity: { duration: 0.22, ease: "easeOut" },
      filter: { duration: 0.3, ease: "easeOut" },
      borderRadius: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
    },
  },
}

/** 系统开启「减少动态效果」时退化为纯透明度渐变 */
const REDUCED_VARIANTS: Variants = {
  hidden: { opacity: 0, transition: { duration: 0.12 } },
  visible: { opacity: 1, transition: { duration: 0.12 } },
}

/** Opens URL in a new tab without `window.open` window features (better popup policy compatibility). */
function openInNewTab(url: string) {
  if (typeof document === "undefined") return
  const a = document.createElement("a")
  a.href = url
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 搜索引擎网格本体。定位与动画由外层的悬浮层负责，这里只管内容。 */
export function SearchList({
  className,
  current,
  onChange,
}: BaseComponentProps & {
  current: number
  onChange: (index: number) => void
}) {
  return (
    <div
      className={cn(
        "text-popover-foreground grid max-h-[min(22rem,38dvh)] grid-cols-2 gap-[3px] overflow-y-auto p-[0.4rem] md:grid-cols-3",
        className,
      )}
      role="group"
      aria-label="搜索引擎"
    >
      {SEARCH_SHORTCUTS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={index === current}
          className="hover:bg-foreground/6 focus-visible:bg-foreground/6 aria-pressed:border-primary/45 aria-pressed:bg-primary/25 flex min-h-[2.4rem] cursor-pointer items-center gap-[0.45rem] rounded-[0.4rem] border border-transparent px-[0.55rem] py-[0.35rem] text-start text-sm transition-colors duration-150 [overflow-wrap:anywhere]"
          onClick={() => onChange(index)}
        >
          <Image src={item.icon} className="size-5 shrink-0 object-contain" alt="" />
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  )
}

type GlassSearchBarProps = {
  className?: string
  /** 占位文案 */
  placeholder?: string
}

/**
 * 毛玻璃胶囊搜索条：半透明底 + backdrop-blur + 细亮边，适合叠在照片/渐变背景上。
 * 展开的引擎面板仍是组件内部的绝对定位元素，只是视觉上做成一片浮在页面之上的磨砂玻璃。
 */
export function GlassSearchBar({ className, placeholder = "搜点什么吧" }: GlassSearchBarProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = React.useState(0)
  /** 缩放原点：对齐触发按钮中心，面板从按钮位置掀开 */
  const [originX, setOriginX] = React.useState(0)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const listId = React.useId()

  const reduceMotion = useReducedMotion()
  const searchItem = SEARCH_SHORTCUTS[current]

  useClickAway(rootRef, () => setOpen(false))

  const handleToggle = React.useCallback(() => {
    if (!open) {
      const bar = barRef.current
      const trigger = triggerRef.current
      if (bar && trigger) {
        const barRect = bar.getBoundingClientRect()
        const triggerRect = trigger.getBoundingClientRect()
        setOriginX(Math.round(triggerRect.left + triggerRect.width / 2 - barRect.left))
      }
    }
    setOpen(!open)
  }, [open])

  const handleCurrentChange = (index: number) => {
    setCurrent(index)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleSearch = React.useCallback(() => {
    const item = searchItem
    if (!item) return
    openInNewTab(buildSearchShortcutUrl(searchItem, query))
    setQuery("")
  }, [searchItem, query])

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        triggerRef.current?.focus()
      }}
    >
      <div
        ref={barRef}
        role="search"
        className="flex h-10 w-full gap-2 rounded-full border border-white/15 bg-black/35 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl"
      >
        <button
          ref={triggerRef}
          type="button"
          className="group flex flex-none cursor-pointer items-center gap-[0.3rem] rounded-full px-3 text-white transition-colors hover:bg-black/25 focus-visible:bg-black/25 aria-expanded:bg-black/25"
          onClick={handleToggle}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "收起搜索引擎列表" : "展开搜索引擎列表"}
        >
          <Image src={searchItem?.icon} className="size-5 shrink-0 object-contain" aria-hidden />
          <ChevronDown
            className="size-[0.85rem] transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-aria-expanded:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </button>
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
          className="min-w-0 flex-1 bg-transparent text-center text-base font-normal tracking-wide text-white placeholder:text-white/75 focus:ring-0 focus:outline-none"
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
      </div>

      <motion.div
        id={listId}
        className={cn(
          styles.panel,
          "border-border/60 bg-popover/72 overflow-hidden border backdrop-blur-3xl backdrop-saturate-150",
          "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_14px_32px_-10px_rgba(0,0,0,0.34),0_40px_80px_-32px_rgba(0,0,0,0.4)]",
        )}
        data-open={open}
        inert={!open}
        aria-hidden={!open}
        initial={false}
        animate={open ? "visible" : "hidden"}
        variants={reduceMotion ? REDUCED_VARIANTS : PANEL_VARIANTS}
        style={{
          transformOrigin: `${originX}px top`,
          transformPerspective: 1400,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <SearchList current={current} onChange={handleCurrentChange} />

        {/* 一次性高光：光扫过玻璃的那一下，只在展开时发生 */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)]"
          initial={false}
          animate={open ? { x: "420%", opacity: [0, 0.9, 0] } : { x: "0%", opacity: 0 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* 顶边细高光：玻璃材质接住光线的位置 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.75),transparent)]"
        />
      </motion.div>
    </div>
  )
}

export default GlassSearchBar
