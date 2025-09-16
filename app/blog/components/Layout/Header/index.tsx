import {headers} from "next/headers";
import {HEADER_BLACKS} from "@/config/blog"
import {PostCategory} from "@/types/postCategory";
import LeftNavigationMenu from "./LeftNavigationMenu";
import RightNavigation from "./RightNavigation";
import Logo from "./Logo";
import Header from "./Header";

export interface HeaderProps {
    categoryList: PostCategory[]
}

export default async function HeaderContainer({categoryList}: HeaderProps) {
    const headerList = await headers()
    const pathname = headerList.get('k-pathname');
    const isHide = HEADER_BLACKS.some(path => pathname?.includes(path))

    if (isHide) {
        return null
    }

    return (
        <Header>
            <div className={'flex flex-items'}>
                <Logo/>
                <LeftNavigationMenu categoryList={categoryList} className={'ml-4'}/>
            </div>
            <RightNavigation/>
        </Header>
    )
}

