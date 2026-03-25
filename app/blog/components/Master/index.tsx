import React from 'react';
import {GradientTransition, Image} from "@/components/k-view"
import {findUniqueUser} from "@/service/user";
import WriteArticleButton from "./WriteArticleButton";

// 博主信息展示组件
export default async function Master() {

    const user = await findUniqueUser({
        email: "997610780@qq.com",
        roles: "superAdmin"
    })

    const statistics = [
        {
            title: "文章",
            value: 100
        },
        {
            title: "分类",
            value: 1560
        },
        {
            title: "访问量",
            value: 130000
        }
    ]
    if (!user) return null;

    return (
        <GradientTransition
            className={'flex-center flex-col w-full  py-4 px-8 rounded-lg text-white shadow-sm hover:shadow-lg transition-all'}>

            <Image className={'size-30 rounded-full'} src={user.avatar as string} draggable={false}/>

            <div className={'text-3xl mt-3.5 font-bold'}>{user.name}</div>

            <div className={'flex gap-x-5 mt-4'}>
                {
                    statistics.map((item, index) => (
                        <div className={'text-center'} key={index}>
                            <div>{item.title}</div>
                            <div className={'mt-1'}>{item.value}</div>
                        </div>
                    ))
                }

            </div>

            <WriteArticleButton/>
        </GradientTransition>

    )
}
