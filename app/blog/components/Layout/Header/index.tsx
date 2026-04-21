import LeftNavigationMenu from "./LeftNavigationMenu";
import RightNavigation from "./RightNavigation";
import Logo from "./Logo";
import Header from "./Header";
import {getPostCategoryList} from "@/service/postCategory";
import {Suspense} from "@/components/k-view"



export default async function HeaderContainer() {
    const categoryRes = await getPostCategoryList()

    return (
        <Header>
            <div className={'flex flex-items'}>
                <Logo/>
                <Suspense>
                    <LeftNavigationMenu categoryList={categoryRes.data} className={'ml-4'}/>
                </Suspense>
            </div>
            <RightNavigation/>
        </Header>
    )
}

