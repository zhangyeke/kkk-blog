import React from 'react';
import {GoButton, GradientTransition, Image} from "@/components/k-view"
import {findUniqueUser} from "@/service/user";



function delay() {
    return new Promise((res) => {
        setTimeout(() => {
            res()
        }, 5000)
    })

}

export default async function Master() {

    const user = await findUniqueUser({
        email: "997610780@qq.com",
        roles: "superAdmin"
    })
    await delay()

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
    return (
        <GradientTransition className={'flex-center flex-col w-[300px]  py-4 px-8 rounded-lg text-white'}>

            <Image className={'size-30 rounded-full'} src={user.avatar} draggable={false}/>

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

            <GoButton className={'mt-4'}/>
        </GradientTransition>

    )
}
