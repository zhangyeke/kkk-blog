"use client"
import React from "react";
import {toast} from "sonner";

import Link from "next/link";
import {ChevronRight, LogOut, NotebookPen, Settings, UserRound} from "lucide-react";
import {useHover} from "react-use";
import {useRouter} from "next/navigation";
import {signOut, useSession} from "next-auth/react"
import {cn} from "@/lib/utils";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Image} from "@/components/k-view";
import {MenuItem} from "./MenuItem"
import {Separator} from "@/components/ui/separator";
import {User} from "@/types/user";
import {logout} from "@/service/auth"

type Menu = {
    label: string;
    icon: React.ReactNode;
    href?: string
}

export type PopoverMenuProps = {
    username?: string;
    menuList: Array<Menu>
    onMenuClick: (item: Menu) => void
}

/*菜单弹窗内容*/
export function PopoverMenu({username, menuList = [], onMenuClick}: PopoverMenuProps) {
    const router = useRouter();
    const handleLogout = React.useCallback(async () => {
        await signOut({
            redirect: false
        })
        router.refresh();
        toast.success("退出登录成功")
    }, [])

    return (
        <>
            <div className={'text-center text-lg font-bold'}>{username}</div>
            <div className={'mt-2'}>
                {
                    menuList.map((item, index) => (
                        <MenuItem
                            key={index}
                            className={'group px-4 py-2 hover:bg-primary/30'}
                            onClick={() => onMenuClick(item)}
                        >
                            <i className={'size-4.5 k-icon'}>{item.icon}</i>
                            <span className={'flex-1'}>{item.label}</span>
                            <ChevronRight className={'size-3.5'}/>
                        </MenuItem>
                    ))
                }
            </div>
            <Separator/>
            <MenuItem className={' hover:bg-primary/30 flex items-center gap-x-2 size-full px-4 py-2 cursor-pointer'}
                      onClick={handleLogout}>
                <LogOut className={'size-4.5'}/>
                退出登录
                {/*<form action={logout} className={'size-full'}>*/}
                {/*    <button type={'submit'}*/}
                {/*            className={'flex items-center gap-x-2 size-full px-4 py-2 cursor-pointer border-none outline-none'}>*/}
                {/*        <LogOut className={'size-4.5'}/>*/}
                {/*        退出登录*/}
                {/*    </button>*/}
                {/*</form>*/}
            </MenuItem>
        </>
    )
}


export function UserBrief() {
    const {data} = useSession();

    const menuList = React.useRef([
        {label: "个人中心", icon: <UserRound/>, href: "/blog/user/me"},
        {label: "写文章", icon: <NotebookPen/>, href: "/blog/article/write"},
        {label: "设置", icon: <Settings className={"group-hover:animate-spin"}/>, href: "/blog/setting"},
    ])
    const user = React.useMemo(() => data?.user as User, [data])
    const username = (user?.name || "kkk")


    const [isFirstHover, setIsFirstHover] = React.useState(false)
    const [isOpen, setIsOpen] = React.useState(false)
    const router = useRouter();
    const Avatar = React.useCallback(
        ({className}: BaseComponentProps) => (
            <Image
                src={user?.avatar || undefined}
                className={cn("w-10 h-10 rounded-full", className)}
                fallback={username.substring(0, 1)}
            />
        ),
        [user?.avatar, user?.name]
    )

    const avatarElement = React.useCallback((hovered: boolean) => {
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
                    className={`opacity-0 shadow-sm absolute z-[100] top-0 left-0 ${
                        notHovered && "animate-avatar-offset-scale-reverse pointer-events-none"
                    } ${hasOpen && 'animate-avatar-offset-scale'} `}
                />
            </Link>
        )
    }, [isFirstHover, isOpen, Avatar])

    const [hoverable] = useHover(avatarElement)

    const handleMenuClick = React.useCallback((item: Menu) => {
        if (item.href) router.push(item.href)
    }, [])

    if (!data) {
        return (
            <Link href={"/login"}>
                <Image className={"size-10 rounded-full"} fallback={"登录"}/>
            </Link>
        )
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