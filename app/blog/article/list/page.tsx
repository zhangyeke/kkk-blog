/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 02:25:36
 * @FilePath: \blog\app\blog\article\list\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { getPostCategoryList } from "@/service/postCategory"
import ClientPageContainer, { type PageContainerProps } from "./ClientPageContainer"

export const metadata = {
    title: "文章列表"
}

export default async function Page({ searchParams }: PageSearchParams<PageContainerProps['defaultParams']>) {
    const category = await getPostCategoryList()
    const routeParams = await searchParams
    return (
        <ClientPageContainer
            key={JSON.stringify(routeParams)}
            defaultParams={routeParams}
            categoryList={category.data}
        />
    )
}
