/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 01:18:24
 * @FilePath: \blog\app\blog\me\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import {CopyText, Image, Section} from "@/components/k-view";
import EditUserForm from "./components/EditUserForm"
import {findUniqueUser, userStatisticsInfo} from "@/service/user";
import {notFound} from "next/navigation";
import {UpdateUserSchema} from "@/validators/user";
import {navList, statistics} from "@/assets/enumerate/menu";
import Link from "next/link";
import {auth} from "@/lib/auth";
import {Separator} from "@/components/ui/separator";

export const metadata = {
    title: "个人中心"
}



export default async function MePage() {
    const session = await auth()
    let user;
    if (session && session.user) {
        user = await userStatisticsInfo(session.user.id)
    } else {
        const up = await findUniqueUser({
            email: "997610780@qq.com",
            roles: "superAdmin"
        })
        user = await userStatisticsInfo(up?.id)
    }

    if (!user.data) return notFound()

    const menuList = navList.filter((item) => {
        if (!("permission" in item)) return true
        return user.data?.roles === item.permission
    })

    return (
        <>
            <div className={'md:hidden px-4 flex-1 flex justify-center items-center flex-col'}>
                <div className={'flex items-center'}>
                    <Link href={'/blog/me/edit'}>
                        <Image className={'rounded-full size-20 shadow-md mr-2'} src={user.data.avatar || ''}/>
                    </Link>
                    <div>
                        <div className={'text-lg'}>{user.data.name}</div>
                        <CopyText className={'text-gray-500'} showIcon={true} text={user.data.email}>{user.data.email}</CopyText>
                    </div>
                </div>
                <div className={'flex justify-around w-full rounded-md py-3 mt-4 shadow-md bg-card/80'}>
                    {
                        statistics.map((item, index) => (
                            <div className={'flex'} key={item.key}>
                                <div className={'text-center '}>
                                    <div>{item.title}</div>
                                    <div className={'mt-1'}>{user.data.statistics[item.key]}</div>
                                </div>
                                {
                                    index < (statistics.length - 1) &&
                                    <Separator className={'ml-10'} orientation="vertical"/>
                                }

                            </div>
                        ))
                    }
                </div>
                <div className={'w-full mt-4 flex-1'}>
                    {
                        menuList.map((item, index) => (
                            <div key={index}>
                                <Link href={item.href} className={'flex py-3'}>
                                    {item.icon}
                                    <span className={'flex-1 ml-1 text-gray-500'}>{item.label}</span>
                                </Link>
                                {index < (menuList.length - 1) && <Separator/>}
                            </div>
                        ))
                    }
                </div>
            </div>


            <div
                className={' w-full md:w-4/5 lg:w-1/2 md:block hidden bg-card/80 rounded-sm border border-solid border-input shadow-md'}>
                <Section>我的信息</Section>

                <div className={'py-4 px-6 '}>
                    <EditUserForm defaultValues={user.data as Partial<UpdateUserSchema>}/>
                </div>
            </div>

        </>


    )
}
