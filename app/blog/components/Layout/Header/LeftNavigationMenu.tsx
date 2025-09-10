import Link from "next/link";
import React from "react";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import {type HeaderProps} from "./index";

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

export default async function HeaderMenu({categoryList, className, style}: HeaderProps & BaseComponentProps) {

    return (
        <NavigationMenu viewport={false} style={style} className={className}>
            <NavigationMenuList>

                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link href={"/"} className={'hover:text-primary flex-center text-white'}>首页</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger
                        className={'text-white hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-white'}>素材</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        {
                            materialList.map((item, index) => (
                                <NavigationMenuLink key={index} asChild>
                                    <Link className={'text-nowrap'} href={item.href}>{item.title}</Link>
                                </NavigationMenuLink>
                            ))
                        }

                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger
                        className={'text-white hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-white'}>学习日记</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        {
                            categoryList.map((item, index) => (
                                <NavigationMenuLink key={index} asChild>
                                    <Link className={'text-nowrap'}
                                          href={`/blog/article/list?cId=${item.id}`}>{item.name}</Link>
                                </NavigationMenuLink>
                            ))
                        }

                    </NavigationMenuContent>
                </NavigationMenuItem>

            </NavigationMenuList>
        </NavigationMenu>


    )

}

