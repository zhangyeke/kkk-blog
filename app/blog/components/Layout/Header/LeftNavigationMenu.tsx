/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 13:32:38
 * @FilePath: \blog\app\blog\components\Layout\Header\LeftNavigationMenu.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */


import Link from "next/link";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { PostCategory } from "@/types/postCategory";

export interface HeaderMenuProps extends BaseComponentProps {
    categoryList?: PostCategory[]
}

const homeMenus = [
    {
        name: "博客",
        href: "/blog"
    },
    {
        name: "起始页",
        href: "/blog/index"
    }
]

const onePieces = [
    {
        name: "书签",
        href: "/blog/bookmark"
    },

]



export default async function HeaderMenu({ categoryList, className, style }: HeaderMenuProps) {

    return (
        <NavigationMenu viewport={false} style={style} className={className}>
            <NavigationMenuList>

                <NavigationMenuItem>
                    <NavigationMenuTrigger
                        className={'hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-white'}>首页</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        {
                            homeMenus.map((item, index) => (
                                <NavigationMenuLink key={index} asChild>
                                    <Link
                                        className={'text-nowrap'}
                                        href={item.href}
                                    >{item.name}</Link>
                                </NavigationMenuLink>
                            ))
                        }

                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                        <Link href={"/blog/map"} className={'hover:text-primary flex-center '}>旅行足迹</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger
                        className={'hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-white'}>记录</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        {
                            categoryList && categoryList.map((item, index) => (
                                <NavigationMenuLink key={index} asChild>
                                    <Link className={'text-nowrap'}
                                        href={`/blog/article/list?cid=${item.id}`}>{item.name}</Link>
                                </NavigationMenuLink>
                            ))
                        }

                    </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger
                        className={'hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-white'}>藏宝阁</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        {
                            onePieces.map((item, index) => (
                                <NavigationMenuLink key={index} asChild>
                                    <Link
                                        className={'text-nowrap'}
                                        href={item.href}
                                    >{item.name}</Link>
                                </NavigationMenuLink>
                            ))
                        }

                    </NavigationMenuContent>
                </NavigationMenuItem>

            </NavigationMenuList>
        </NavigationMenu>


    )

}

