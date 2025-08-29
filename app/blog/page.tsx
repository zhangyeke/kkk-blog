import {Metadata} from "next"
import Link from "next/link";
import Banner from "@/components/Banner";
import {PhotoMaterial} from "@/types/Material";
import {WavyGroup} from "@/components/Wavy";
import {getPostCategoryList} from "@/service/PostCategory";
import {fetchPhotoWall} from "@/service/Material";

export const metadata: Metadata = {}


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
            </div>
        </div>
    )
}
