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

export interface HeaderMenuProps extends BaseComponentProps {

    menuList:NavigationMenuType[]
}



export default async function HeaderMenu({  menuList,className, style }: HeaderMenuProps) {

    return (
        <NavigationMenu viewport={false} style={style} className={className}>
            <NavigationMenuList>
                {
                    menuList.map((item,i)=>{

                        if(Array.isArray(item.children)){
                            return (
                                <NavigationMenuItem key={i}>
                                    <NavigationMenuTrigger
                                        className={'hover:text-primary data-[state=open]:text-primary data-[state=open]:bg-white'}>首页</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        {
                                            item.children.map((menu, index) => (
                                                <NavigationMenuLink key={index+`${i}`} asChild>
                                                    <Link
                                                        className={'text-nowrap'}
                                                        href={menu.href || ''}
                                                    >{menu.name}</Link>
                                                </NavigationMenuLink>
                                            ))
                                        }

                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            )
                        }

                        return (
                            <NavigationMenuItem key={i}>
                                <NavigationMenuLink asChild>
                                    <Link href={item.href || ''} className={'hover:text-primary flex-center '}>{item.name}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        )
                    })
                }


            </NavigationMenuList>
        </NavigationMenu>


    )

}

