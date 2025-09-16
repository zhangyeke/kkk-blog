"use client"
import React from "react";
import {toast} from "sonner";
import Link from "next/link";
import {ChevronRight, LogOut, NotebookPen, Settings, UserRound} from "lucide-react";
import {useHover} from "react-use";
import {type Session} from "next-auth";
import {cn} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Image} from "@/components/k-view";
import {MenuItem} from "./MenuItem"
import {Separator} from "@/components/ui/separator";
import {logout} from "@/service/auth";
import {User} from "@/types/user"
import {useRouter} from "next/navigation";

export type PopoverMenuProps = {
    username?: string;
    menuList: Array<{
        label: string;
        icon: React.ReactNode;
        href?: string
    }>
    onMenuClick: <T>(item: T) => void
}

/*菜单弹窗内容*/
export function PopoverMenu({username, menuList = [], onMenuClick}: PopoverMenuProps) {


    async function handleLogout() {
        await logout()
        toast.success("退出登录成功")
    }

    return (
        <>
            <div className={'text-center text-lg font-bold'}>{username}</div>
            <div className={'mt-2'}>
                {
                    menuList.map((item, index) => (
                        <MenuItem key={index} className={'group px-4 py-2 hover:bg-primary/30'}
                                  onClick={() => onMenuClick(item)}>
                            <i className={'size-4.5 k-icon'}>{item.icon}</i>
                            <span className={'flex-1'}>{item.label}</span>
                            <ChevronRight className={'size-3.5'}/>
                        </MenuItem>
                    ))
                }
            </div>
            <Separator/>
            <MenuItem className={'px-4 py-2 hover:bg-gray-100'} onClick={handleLogout}>
                <LogOut className={'size-4.5'}/>
                退出登录
            </MenuItem>
        </>
    )
}


export type UserBriefProps = {
    session: Session | null
}

export function UserBrief({session}: UserBriefProps) {
    if (!session) {
        return (
            <Link href={"/login"}>
                <Image className={"w-10 h-10 rounded-full"} fallback={"登录"}/>
            </Link>
        )
    }

    const menuList = React.useRef([
        {label: "个人中心", icon: <UserRound/>, href: "/blog/user/me"},
        {label: "写文章", icon: <NotebookPen/>, href: "/blog/article/editor"},
        {label: "设置", icon: <Settings className={"group-hover:animate-spin"}/>, href: "/blog/setting"},
    ])
    const user = session.user as User
    const username = (user?.name || "kkk").substring(0, 1)
    const avatar = user?.avatar || ''

    const [isFirstHover, setIsFirstHover] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const router = useRouter();
    const Avatar = React.useCallback(
        ({className}: BaseComponentProps) => (
            <Image
                src={avatar}
                className={cn("w-10 h-10 rounded-full", className)}
                fallback={username}
            />
        ),
        [avatar, username]
    )

    const avatarElement = (hovered: boolean) => {
        if (hovered && !isFirstHover) setIsFirstHover(true)
        if (hovered && !isOpen) setIsOpen(true)

        const notHovered = !hovered && isFirstHover && !isOpen
        const hasOpen = isOpen || hovered
        return (
            <Link
                href={"/blog/user/me"}
                className={`relative`}
            >
                <Avatar
                    className={`${hasOpen && "delay-50 opacity-0"} ${notHovered && "animate-small-avatar-show"}`}
                />
                <Avatar
                    className={`opacity-0 shadow-sm absolute top-0 left-0 ${
                        notHovered && "animate-avatar-offset-scale-reverse pointer-events-none"
                    } ${hasOpen && 'animate-avatar-offset-scale'} `}
                />
            </Link>
        )
    }

    const [hoverable] = useHover(avatarElement)

    function handleMenuClick(item: typeof menuList.current[number]) {
        router.push(item.href)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>{hoverable}</PopoverTrigger>
            <PopoverContent
                sideOffset={10}
                className={"p-0  pt-12 border-none shadow-md overflow-hidden transform -translate-x-1/6"}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <PopoverMenu username={username} menuList={menuList.current} onMenuClick={handleMenuClick}/>
            </PopoverContent>
        </Popover>
    )
}