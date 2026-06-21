"use client"
import { cloneDeep } from "lodash"
import { toast } from "sonner"
import Link from "next/link"
import { Empty, Image, TextLine } from "@/components/k-view"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { BookmarkCategoryWithBookmarks } from "@/types/bookmark"
import { useClickAway } from "react-use"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import SearchBar, { SearchBarProps } from "@/app/blog/components/Article/SearchBar"
import { Search } from "lucide-react"

const SearchTools = ({ ref, onSearch, onClear }: SearchBarProps) => {
  const searchTypes = useRef([
    {
      label: "标题",
      value: "title",
    },
    {
      label: "分类",
      value: "category",
    },
    {
      label: "简介",
      value: "intro",
    },
  ])
  return <SearchBar ref={ref} searchTypeList={searchTypes.current} onSearch={onSearch} onClear={onClear} />
}

export default function ExpandableSearch({ onSearch, onClear }: Pick<SearchBarProps, "onSearch" | "onClear">) {
  const [isOpen, setIsOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const openSearchBar = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation() // 阻止冒泡
    setIsOpen(true)
  }, [])

  // 1. 针对移动端优化的点击外部事件，防止 touchstart 误触
  useClickAway(
    containerRef,
    (event) => {
      // 1. 获取当前被点击/触摸的真实 DOM 元素
      const target = event.target as Element

      // 2. 检查点击的元素本身，或者它的父级链条中是否包含指定的类名（例如 .ignore-click-away）
      if (target && target.closest(".search-options")) {
        // 如果点到了带有该类名的元素，直接拦截，不执行收起逻辑
        return
      }

      if (isOpen) {
        setIsOpen(false)
      }
    },
    ["click", "touchend"]
  )

  useEffect(() => {
    if (isOpen) {
      // 延迟 50ms 聚焦，确保动画开始执行后再唤起手机软键盘
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className="relative flex h-12 touch-none items-center justify-end"
      // touch-none 防止误触手机浏览器的原生左右滑动手势
    >
      <motion.div
        layout
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 30,
        }}
        className={cn(
          "bg-background border-input flex items-center overflow-hidden border shadow-sm",
          isOpen ? "w-auto rounded-full" : "h-12 w-12 justify-center rounded-full"
        )}
      >
        {/* 2. 增加了 type="button" 和 cursor-pointer */}
        <motion.button
          type="button"
          layout
          onClick={openSearchBar}
          className={cn(
            "text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-center rounded-full transition-colors",
            isOpen ? "hidden" : "h-full w-full"
          )}
        >
          <Search className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex-1"
            >
              <SearchTools ref={inputRef} className={"border-none"} onSearch={onSearch} onClear={onClear} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
type PageContainerProps = {
  data: BookmarkCategoryWithBookmarks[]
} & BaseComponentProps

function CategoryAnchor({ data }: PageContainerProps) {
  // <Anchor />
  return (
    <div
      className={
        "bg-background fixed top-30 right-0 z-50 hidden max-w-50 rounded-tl-md rounded-bl-md p-4 pb-2 shadow-md lg:block"
      }
    >
      {data.map((item, index) => (
        <Link
          className={"mb-2 block overflow-hidden text-ellipsis whitespace-nowrap"}
          key={index}
          href={`#${item.name}`}
        >
          <TextLine>{item.name}</TextLine>
        </Link>
      ))}
    </div>
  )
}
/*书签列表组件*/
const Bookmarks = ({ bookmarks }: { bookmarks: BookmarkCategoryWithBookmarks["bookmarks"] }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {bookmarks.map((item) => (
        <Link
          target="_blank"
          rel="noreferrer"
          href={item.url}
          key={item.id}
          className="group bg-card hover:bg-primary/50 flex h-28 cursor-pointer items-center rounded-lg p-4 shadow-sm transition-all duration-500 hover:shadow-lg"
        >
          <span className="inline-flex size-14 min-w-14 shrink-0 origin-top-left scale-100 overflow-hidden opacity-100 transition-all duration-500 ease-out group-hover:w-0 group-hover:min-w-0 group-hover:scale-0 group-hover:opacity-0 motion-reduce:transition-none motion-reduce:group-hover:h-14 motion-reduce:group-hover:w-14 motion-reduce:group-hover:min-w-14 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:opacity-100">
            <Image
              className="bg-background size-full shrink-0 rounded-full"
              src={item.icon ?? ""}
              fallback={item.title.substring(0, 1)}
              alt={item.title}
              objectFit="contain"
            />
          </span>
          <div className="ml-4 min-w-0 flex-1 transition-[margin-left] duration-500 ease-out group-hover:ml-0">
            <h3 className="text-base font-bold group-hover:text-white">{item.title}</h3>
            <div className="line-clamp-3 text-sm text-gray-500 group-hover:text-gray-900">
              <TextLine className="">{item.intro}</TextLine>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export function PageContainer({ className, data }: PageContainerProps) {
  const [categories, setCategories] = useState(data)
  const originData = useRef(cloneDeep(data))

  // 初始化数据源
  const initCategories = useCallback(() => {
    setCategories(originData.current)
  }, [originData.current])

  const handleSearch = useCallback(({ keyword, type, label }: { label?: string; keyword: string; type: string }) => {
    if (!keyword) {
      initCategories()
      return
    }

    const origin = originData.current

    if (type === "category") {
      const newList = origin.filter((item) => item.name.includes(keyword))
      if (newList.length) {
        setCategories(newList)
      } else {
        toast.info(`没有查询到【${label}】的《${keyword}》的书签`)
      }
      return
    }

    const list = origin.flatMap((item) => item.bookmarks).filter((item) => item[type].toLowerCase().includes(keyword))
    setCategories([
      {
        id: new Date().getTime(),
        name: `根据【${label}】查询到《${keyword}》相关的书签结果：`,
        bookmarks: list,
      } as BookmarkCategoryWithBookmarks,
    ])
  }, [])

  useEffect(() => {
    originData.current = cloneDeep(data)
  }, [data])

  return (
    <div className={"md:scroll-mt-[var(--header-height)]"}>
      <div className="fixed top-20 right-3 z-50 md:hidden">
        <ExpandableSearch onSearch={handleSearch} onClear={initCategories} />
      </div>
      <CategoryAnchor data={categories} />
      <div className="flex-center h-40 w-full bg-[url(/images/bg_banner.png)] bg-cover md:h-80 lg:h-125 lg:bg-center">
        <div className={"bg-background ml-[40%] hidden w-85 rounded-sm md:block lg:ml-[30%]"}>
          <SearchTools onSearch={handleSearch} onClear={initCategories} />
        </div>
      </div>
      <div className="container pb-4">
        <div className={className}>
          {categories.map((cate) => (
            <div key={cate.id}>
              <h2 id={cate.name} className="text-primary my-4 text-center text-2xl font-bold">
                {cate.name}
              </h2>
              {cate.bookmarks.length > 0 ? <Bookmarks bookmarks={cate.bookmarks} /> : <Empty />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
