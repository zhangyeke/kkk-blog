import {Metadata} from "next"
import {Banner, WavyGroup} from "@/components/k-view";
import {fetchPhotoWall} from "@/service/material";
import {PhotoMaterial} from "@/types/material";
import {GLOBAL_TITLE} from "@/config/blog"
import {Button} from "@/components/ui/button";
import Saying from "@/app/blog/components/Saying";

export const metadata: Metadata = {
    title: GLOBAL_TITLE
}


export default async function Web() {

    const bannerData = await fetchPhotoWall({
        per_page: 5,
        min_width: 1920,
        min_height: 500,
        editors_choice: true,
        category: "动漫"
    })

    // const data = await getSaying()
    // console.log("返回了", data)
    return (
        <div>
            <div className={"relative"}>
                <Banner<PhotoMaterial> list={bannerData.hits} imageKey={"largeImageURL"}
                                       imageClass={'w-full h-[500px]'}/>
                <WavyGroup className={"absolute bottom-0 w-full z-10"}/>
                <Saying className={'absolute position-center z-100 w-fit break-keep text-xl'} color={'#fff'}/>

            </div>
            <Button>按钮</Button>

        </div>
    )
}
