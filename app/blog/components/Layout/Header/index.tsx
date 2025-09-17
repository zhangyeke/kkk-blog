
import {PostCategory} from "@/types/postCategory";
import LeftNavigationMenu from "./LeftNavigationMenu";
import RightNavigation from "./RightNavigation";
import Logo from "./Logo";
import Header from "./Header";

export interface HeaderProps {
    categoryList: PostCategory[]
}

export default async function HeaderContainer({categoryList}: HeaderProps) {

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

