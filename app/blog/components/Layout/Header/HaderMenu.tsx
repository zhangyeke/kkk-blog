import Link from "next/link"

import {
    NavigationMenu,
    NavigationMenuContent, NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import http from "@/lib/http";
import {PostCategory} from "@/types/PostCategory";

const materialList = [
    {
        title: "图片素材",
        href: "/blog/picture",
    },
    {
        title: "视频素材",
        href: "/blog/videos",
    },

]

export default async function HeaderMenu(props: BaseComponentProps) {

    const categoryResult = await http.get<ApiResource<PostCategory[]>>('/postCategory', {
        next: {
            revalidate: 60 * 60 * 24
        }
    })
    console.log(categoryResult.data.data, "分类")

    return (
        <NavigationMenu className={props.className} viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/blog">首页</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>素材资源</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        {
                            materialList.map((item, index) => (
                                <NavigationMenuLink asChild key={index}>
                                    <Link href={item.href}>{item.title}</Link>
                                </NavigationMenuLink>
                            ))
                        }
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>记录</NavigationMenuTrigger>
                    <NavigationMenuContent className={"w-fit"}>
                        {
                            categoryResult.data.data.map((item) => (
                                <NavigationMenuLink asChild key={item.id}>
                                    <Link className={'text-nowrap'} href={`/blog/post/${item.id}`}>{item.name}</Link>
                                </NavigationMenuLink>
                            ))
                        }
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}

