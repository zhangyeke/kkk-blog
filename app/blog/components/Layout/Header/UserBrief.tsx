"use client"

import { type PointerEvent, useEffect, useRef, useState } from "react"
import type { Session } from "next-auth"
import Link from "next/link"
import { ChevronRight, LogOut, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { navList } from "@/assets/enumerate/menu"
import { Image } from "@/components/k-view/Image"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { LogOutButton } from "./LogOutButton"

const profileHref = "/blog/me"
const rowClass = "hover:bg-muted focus-visible:bg-muted flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm focus-visible:outline-none"

export type UserBriefProps = {
  session: Session | null
}

export function UserBrief({ session }: UserBriefProps) {
  const user = session?.user
  const username = user?.name || "kkk"
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const content = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hoverOpened = useRef(false)
  const pointerType = useRef<string>(undefined)

  function cancelClose() {
    clearTimeout(closeTimer.current)
  }

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function changeOpen(nextOpen: boolean) {
    cancelClose()
    hoverOpened.current = false
    setOpen(nextOpen)
  }

  function enter(event: PointerEvent) {
    if (event.pointerType !== "mouse") return
    cancelClose()
    if (!open) {
      hoverOpened.current = true
      setOpen(true)
    }
  }

  function leave(event: PointerEvent) {
    if (event.pointerType !== "mouse" || !hoverOpened.current) return
    cancelClose()
    closeTimer.current = setTimeout(() => {
      if (!content.current?.contains(document.activeElement)) setOpen(false)
    }, 140)
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        aria-label={`${username}的账户菜单`}
        className="focus-visible:outline-ring relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2"
        onPointerEnter={enter}
        onPointerLeave={leave}
        onPointerDown={(event) => { pointerType.current = event.pointerType }}
        onClick={(event) => {
          if (event.detail === 0 || pointerType.current !== "mouse") return
          event.preventDefault()
          changeOpen(false)
          router.push(profileHref)
        }}
      >
        <Image
          src={user?.avatar || undefined}
          alt=""
          fallback={username.slice(0, 1)}
          className={cn(
            "rounded-full size-10 transition-transform duration-350 ease-in-out motion-reduce:transition-none",
            open && "translate-y-5 -translate-x-5 scale-200 ring-2 ring-background"
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        ref={content}
        aria-label="账户菜单"
        sideOffset={10}
        collisionPadding={12}
        className="z-[299] w-[300px] max-w-[calc(100vw-1.5rem)] rounded-lg px-3 pt-10 pb-2 shadow-lg motion-reduce:animate-none transform -translate-x-5"
        onPointerEnter={enter}
        onPointerLeave={leave}
        onOpenAutoFocus={(event) => {
          if (hoverOpened.current) event.preventDefault()
        }}
        onCloseAutoFocus={(event) => {
          if (hoverOpened.current) event.preventDefault()
        }}
      >
        <div className="mb-2 truncate px-3 text-center text-lg font-medium" title={username}>{username}</div>
        <Link href={profileHref} className={rowClass} onClick={() => changeOpen(false)}>
          <UserRound className="size-4" aria-hidden="true" />
          <span className="flex-1">个人中心</span>
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
        {navList.filter((item) => !("permission" in item) || user?.roles === item.permission).map((item) => (
          <Link key={item.href} href={item.href} className={cn(rowClass, "group")} onClick={() => changeOpen(false)}>
            <span className="[&_svg]:size-4" aria-hidden="true">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        ))}
        <Separator className="my-1" />
        <LogOutButton className={cn(rowClass, "cursor-pointer")}>
          <LogOut className="size-4" aria-hidden="true" />
          退出登录
        </LogOutButton>
      </PopoverContent>
    </Popover>
  )
}
