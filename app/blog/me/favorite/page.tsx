import {getPostCategoryList} from "@/service/postCategory";
import ClientPageContainer from "./ClientPageContainer";


export default async function Page() {
    const category = await getPostCategoryList()

    return (
        <ClientPageContainer categoryList={category.data}/>
    )
}
