import LeftNavigationMenu from "./LeftNavigationMenu";
import RightNavigation from "./RightNavigation";
import Logo from "./Logo";
import Header from "./Header";
import {getPostCategoryList} from "@/service/postCategory";



export default async function HeaderContainer() {
    const categoryRes = await getPostCategoryList()

    return (
        <Header>
            <div className={'flex flex-items'}>
                <Logo/>
                <LeftNavigationMenu categoryList={categoryRes.data} className={'ml-4'}/>
            </div>
            <RightNavigation/>
        </Header>
    )
}

