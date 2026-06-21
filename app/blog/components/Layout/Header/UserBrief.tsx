"use client"
import React from "react"
import { Session } from "next-auth"
import Link from "next/link"
import { ChevronRight, LogOut } from "lucide-react"
import { useHover } from "react-use"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Image } from "@/components/k-view"
import { MenuItem } from "./MenuItem"
import { Separator } from "@/components/ui/separator"
import { User } from "@/types/user"
import { navList } from "@/assets/enumerate/menu"
import { LogOutButton } from "./LogOutButton"

type Menu = {
  label: string
  icon: React.ReactNode
  href?: string
}

export type PopoverMenuProps = {
  username?: string
  menuList: Array<Menu>
  onMenuClick: (item: Menu) => void
}

/*菜单弹窗内容*/
export function PopoverMenu({ username, menuList = [], onMenuClick }: PopoverMenuProps) {
  return (
    <>
      <div className={"text-center text-lg font-bold"}>{username}</div>
      <div className={"mt-2"}>
        {menuList.map((item, index) => (
          <MenuItem key={index} className={"group hover:bg-primary/30 px-4 py-2"} onClick={() => onMenuClick(item)}>
            <i className={"k-icon size-4.5"}>{item.icon}</i>
            <span className={"flex-1"}>{item.label}</span>
            <ChevronRight className={"size-3.5"} />
          </MenuItem>
        ))}
      </div>
      <Separator />
      <MenuItem className={"hover:bg-primary/30"}>
        <LogOutButton
          className={"flex size-full cursor-pointer items-center gap-x-2 border-none px-4 py-2 outline-none"}
        >
          <LogOut className={"size-4.5"} />
          退出登录
        </LogOutButton>
      </MenuItem>
    </>
  )
}

export type UserBriefProps = {
  session: Session | null
}

export function UserBrief({ session }: UserBriefProps) {
  const user = React.useMemo(() => session?.user as User, [session])
  const username = user?.name || "kkk"

  const [isFirstHover, setIsFirstHover] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const router = useRouter()

  const menuList = React.useMemo(() => {
    return navList.filter((item) => {
      if (!("permission" in item)) return true
      return user?.roles === item.permission
    })
  }, [user?.roles])

  const Avatar = React.useCallback(
    ({ className }: BaseComponentProps) => (
      <Image
        src={user?.avatar || undefined}
        className={cn("h-10 w-10 rounded-full", className)}
        fallback={username.substring(0, 1)}
      />
    ),
    [user?.avatar, user?.name]
  )

  const avatarElement = React.useCallback(
    (hovered: boolean) => {
      if (hovered && !isFirstHover) setIsFirstHover(true)
      if (hovered && !isOpen) setIsOpen(true)

      const notHovered = !hovered && isFirstHover && !isOpen
      const hasOpen = isOpen || hovered
      return (
        <div className={`relative`}>
          <Avatar className={`${hasOpen && "opacity-0 delay-50"} ${notHovered && "animate-small-avatar-show"}`} />
          <Link
            className={`absolute top-0 left-0 z-[100] rounded-full opacity-0 shadow-sm ${
              notHovered ? "animate-avatar-offset-scale-reverse pointer-events-none" : ""
            } ${hasOpen ? "animate-avatar-offset-scale" : ""} `}
            href={"/blog/me"}
          >
            <Avatar />
          </Link>
        </div>
      )
    },
    [isFirstHover, isOpen, Avatar]
  )

  const [hoverable] = useHover(avatarElement)

  const handleMenuClick = React.useCallback((item: Menu) => {
    if (item.href) router.push(item.href)
  }, [])

  /*    if (!user) {
            return (
                <Link href={"/login"}>
                    <Image className={"size-10 rounded-full"} fallback={"登录"}/>
                </Link>
            )
        }*/

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{hoverable}</PopoverTrigger>
      <PopoverContent
        sideOffset={10}
        className={"-translate-x-1/6 transform overflow-hidden border-none p-0 pt-12 shadow-md"}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <PopoverMenu username={username} menuList={menuList} onMenuClick={handleMenuClick} />
      </PopoverContent>
    </Popover>
  )
}
