"use client"
import {ChevronDownIcon} from "lucide-react"
import Link from "next/link";
import React from "react";
import Image from "@/components/Image"
import {
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
    HoverDropdownMenu,
} from "@/components/ui/dropdown-menu"
import {MenuContext} from "./context";

const materialList = [
    {
        title: "图片素材",
        href: "/blog/pictures",
    },
    {
        title: "视频素材",
        href: "/blog/videos",
    },

]

function HeaderMenu() {
    const {categoryList} = React.useContext(MenuContext)
    return (
        <nav className={'flex items-center gap-x-4 h-full text-white'}>
            <Link href={"/"} className={'hover:text-primary flex-center'}>首页</Link>
            <HoverDropdownMenu>
                {
                    (isOpen: boolean) => (
                        <>
                            <DropdownMenuTrigger className={'cursor-pointer h-full flex-center'}>
                                素材
                                <ChevronDownIcon
                                    className={` ${isOpen ? 'rotate-180' : ''} transition-all duration-300`}/>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 z-[200]">
                                <DropdownMenuGroup>
                                    {
                                        materialList.map((item, index) => (
                                            <DropdownMenuItem key={index}>
                                                <Link className={'w-full h-full'} href={item.href}>{item.title}</Link>
                                            </DropdownMenuItem>
                                        ))
                                    }
                                </DropdownMenuGroup>

                            </DropdownMenuContent>
                        </>
                    )
                }

            </HoverDropdownMenu>

            <HoverDropdownMenu>
                {
                    (isOpen: boolean) => (
                        <>
                            <DropdownMenuTrigger className={'cursor-pointer h-full flex-center group'}>
                                记录
                                <ChevronDownIcon
                                    className={`${isOpen ? 'rotate-180' : ''} transition-all duration-300`}/>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 z-[200]">
                                <DropdownMenuGroup>
                                    {
                                        categoryList && categoryList.map((item, index) => (
                                            <DropdownMenuItem key={index}>
                                                <Link className={'w-full h-full'} href={{
                                                    pathname: "/blog/article/search",
                                                    query: {
                                                        c_id: item.id
                                                    }
                                                }}>{item.name}</Link>
                                            </DropdownMenuItem>
                                        ))
                                    }
                                </DropdownMenuGroup>

                            </DropdownMenuContent>

                        </>
                    )
                }
            </HoverDropdownMenu>


            <Link href={'/blog/login'}>
                <Image className={'w-10 h-10 rounded-full'} fallback={'登录'}/>
            </Link>
        </nav>
    )

}


export default React.memo(HeaderMenu)