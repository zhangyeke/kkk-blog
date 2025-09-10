"use client"
import React from "react"
import {useRouter} from "next/navigation";
import {MonitorCog, Star} from "lucide-react";

/*头部右边导航菜单*/
export const HEADER_NAVIGATION_LIST = [
    {
        name: "收藏",
        icon: <Star className={'size-[inherit]'}/>,
        href: "/blog/user/collect"
    },
    {
        name: "后台管理",
        icon: <MonitorCog className={'size-[inherit]'}/>,
        href: "/admin"
    }
]

export function NavigationItem({children, onClick}: Slots<'children'> & {
    onClick: (e?: React.MouseEvent<HTMLDivElement>) => void
}) {

    return (
        <div className={'cursor-pointer flex-center flex-col  gap-y-1 group '} onClick={onClick}>
            {children}
        </div>

    )
}

export function NavigationList() {

    const router = useRouter()


    return (
        <div className={'flex items-center gap-x-4 text-white text-sm '}>
            {
                HEADER_NAVIGATION_LIST.map((item, index) => (
                    <NavigationItem onClick={() => router.push(item.href)} key={index}>

                        <div className={'size-[18px] group-hover:animate-bounce'}>
                            {item.icon}
                        </div>
                        {item.name}
                    </NavigationItem>
                ))
            }
        </div>
    )
}
