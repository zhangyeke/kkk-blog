"use client"
import React from "react";
import {Banner, WavyGroup} from "@/components/k-view";
import Saying from "@/app/blog/components/Saying";
import {useAppStore} from "@/hooks";


export default function HomeHeader() {
    const {homeBanners} = useAppStore(
        (state) => state,
    )

    /*
        const bannerData = await fetchPhotoWall({
            per_page: 5,
            min_width: 1920,
            min_height: 500,
            editors_choice: true,
            category: "动漫"
        })
    */

    return (
        <div className={"relative"}>
            <Banner
                list={homeBanners}
                imageKey={''}
            />

            {/*波浪组件*/}
            <WavyGroup
                className={"absolute bottom-0 w-full z-10"}
            />
            {/*一句随机言言*/}
            <Saying

                className={'absolute position-center z-100 w-fit break-keep text-xl py-2 px-4 rounded-full'}
            />

        </div>
    )
}
