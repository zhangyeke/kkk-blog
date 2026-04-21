import {getPostCategoryList} from "@/service/postCategory"
import PageContainer, {type PageContainerProps} from "./PageContainer"

export default async function Page({searchParams}: PageSearchParams<PageContainerProps['defaultParams']>) {
    const category = await getPostCategoryList()

    const routeParams = await searchParams

    return (
        <PageContainer
            defaultParams={routeParams}
            categoryList={category.data}
        />
    )
}
