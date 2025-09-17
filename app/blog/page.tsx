import {Metadata} from "next"
import {Banner, Suspense, WavyGroup} from "@/components/k-view";
import {fetchPhotoWall} from "@/service/material";
import {PhotoMaterial} from "@/types/material";
import {GLOBAL_TITLE} from "@/config/blog"
import Saying from "@/app/blog/components/Saying";
import Master from "@/app/blog/components/Master";

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

    return (
        <div>
            <div className={"relative"}>
                <Banner<PhotoMaterial> list={bannerData.hits} imageKey={"largeImageURL"}
                                       imageClass={'w-full h-[500px]'}/>
                <WavyGroup className={"absolute bottom-0 w-full z-10"}/>
                <Saying className={'absolute position-center z-100 w-fit break-keep text-xl py-2 px-4 rounded-full'}
                />

            </div>
            <div className={'container flex'}>
                <aside className={'w-300px'}>
                    <Suspense className={'w-full h-[330px]'}>
                        <Master/>
                    </Suspense>
                </aside>
                <section>

                </section>

            </div>

        </div>
    )
}
