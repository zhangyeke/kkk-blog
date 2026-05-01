import {getPostCategoryList} from "@/service/postCategory";
import ClientPageContainer from "./ClientPageContainer";
export const metadata = {
    title: "我的收藏"
}


export default async function Page() {
    const category = await getPostCategoryList()

    return (
        <ClientPageContainer categoryList={category.data}/>
    )
}
