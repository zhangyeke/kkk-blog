/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 01:18:24
 * @FilePath: \blog\app\blog\me\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { Section } from "@/components/k-view";
import EditUserForm from "./components/EditUserForm"
import { getMeInfo } from "@/service/user";
import { notFound } from "next/navigation";
import { UpdateUserSchema } from "@/validators/user";
export default async function MePage() {
    const user = await getMeInfo()

    if (!user.data) return notFound()

    return (

        <div className={'bg-card/80 rounded-sm border border-solid border-input w-full lg:w-1/2 shadow-md'}>
            <Section>我的信息</Section>

            <div className={'py-4 px-6 '}>
                <EditUserForm defaultValues={user.data as Partial<UpdateUserSchema>} />
            </div>
        </div>

    )
}
