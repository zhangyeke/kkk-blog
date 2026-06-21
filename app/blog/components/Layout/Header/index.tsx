import {getPostCategoryList} from "@/service/postCategory";
import MobileNavigation from "./MobileNavigation"
import LeftNavigationMenu from "./LeftNavigationMenu";
import RightNavigation from "./RightNavigation";
import Logo from "./Logo";
import Header from "./Header";
import {auth} from "@/lib/auth";



export default async function HeaderContainer() {
    const session = await auth()

    const categoryRes = await getPostCategoryList()

    const menuList = [
        {
            name:"首页",
            children:[
                {
                    name: "博客",
                    href: "/blog"
                },
                {
                    name: "起始页",
                    href: "/blog/index"
                }
            ]
        },

        {
            name:"记录",
            children: categoryRes.data.map(item=>({
                ...item,
                href:`/blog/article/list?cid=${item.id}`
            })),
        },
        {
            name:"藏宝阁",
            children: [
                {
                    name: "书签",
                    href: "/blog/bookmark"
                },
            ]
        },
        {
            name:"旅行足迹",
            href:"/blog/map"
        },
    ]
    return (
        <Header>
            <div className={'flex flex-items'}>
                <Logo/>
                <LeftNavigationMenu className={'md:ml-4 md:flex hidden'} menuList={menuList} />
            </div>
            <RightNavigation className={'md:flex hidden'} session={session}/>
            <MobileNavigation className={'md:hidden'} menuList={menuList} session={session}/>
        </Header>
    )
}

