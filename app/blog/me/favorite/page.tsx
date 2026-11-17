import {getPostCategoryList} from "@/service/postCategory";
import ClientPageContainer from "./ClientPageContainer";
import { requireBlogAccountPathAccess } from "@/lib/blog/permissions"
export const metadata = {
    title: "我的收藏"
}


export default async function Page() {
    await requireBlogAccountPathAccess("/blog/me/favorite")
    const category = await getPostCategoryList()

    return (
        <ClientPageContainer categoryList={category.data}/>
    )
}
