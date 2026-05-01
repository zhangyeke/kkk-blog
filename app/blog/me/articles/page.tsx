/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-24 15:31:42
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 02:11:19
 * @FilePath: \blog\app\blog\me\articles\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {getPostCategoryList} from "@/service/postCategory";
import ClientPageContainer from "./ClientPageContainer";

export const metadata = {
    title: "我的文章"
}

export default async function Page() {
    const category = await getPostCategoryList()

    return (
        <ClientPageContainer categoryList={category.data}/>
    )
}
