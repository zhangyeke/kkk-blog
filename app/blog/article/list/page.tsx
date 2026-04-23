import {getPostCategoryList} from "@/service/postCategory"
import ClientPageContainer, {type PageContainerProps} from "./ClientPageContainer"

export default async function Page({searchParams}: PageSearchParams<PageContainerProps['defaultParams']>) {
    const category = await getPostCategoryList()

    const routeParams = await searchParams

    return (
        <ClientPageContainer
            defaultParams={routeParams}
            categoryList={category.data}
        />
    )
}
