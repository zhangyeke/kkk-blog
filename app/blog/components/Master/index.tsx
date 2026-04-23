import React from 'react';
import {cacheTag} from "next/cache"
import {GradientTransition, Image} from "@/components/k-view"
import {findUniqueUser, userStatisticsInfo} from "@/service/user";
import WriteArticleButton from "./WriteArticleButton";
import {auth} from "@/lib/auth";


const statistics = [
    {
        title: "文章",
        key: 'totalPosts'
    },
    {
        title: "收藏数",
        key: 'totalFavorites'
    },
    {
        title: "浏览量",
        key: 'totalPV'
    }
]

// 博主信息展示组件
export default async function Master() {
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

    if (!(user && user.data)) return null;

    return (
        <GradientTransition
            className={'flex-center flex-col w-full  py-4 px-8 rounded-lg text-white shadow-sm hover:shadow-lg  transition-shadow duration-300'}>

            <Image
                className={'size-30 rounded-full'}
                fallback={user.data.name.substring(0, 1)}
                src={user.data.avatar}
                draggable={false}
            />

            <div className={'text-3xl mt-3.5 font-bold'}>{user.data.name}</div>

            <div className={'flex gap-x-5 mt-4'}>
                {
                    statistics.map((item, index) => (
                        <div className={'text-center'} key={index}>
                            <div>{item.title}</div>
                            <div className={'mt-1'}>{user.data.statistics[item.key]}</div>
                        </div>
                    ))
                }

            </div>

            <WriteArticleButton/>
        </GradientTransition>

    )
}
