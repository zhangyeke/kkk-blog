import {Metadata} from "next"
import Link from "next/link";
import Banner from "@/components/Banner";
import http from "@/lib/http";
import {MaterialResource, PhotoMaterial} from "@/types/Material";

export const metadata: Metadata = {}


export default async function Web() {

    const bannerRes = await http.get<BaseResource<MaterialResource<PhotoMaterial>>>('/material', {
        params: {
            per_page: 5,
            min_width: 1920,
            min_height: 500,
            editors_choice: true,
            category: "动漫"
        }
    })
    return (
        <div className="text-primary">
            <Banner<PhotoMaterial> list={bannerRes.data.hits} imageKey={"webformatURL"}
                                   imageClass={'w-full h-[500px]'}/>
            <Link href={'/blog/login'}>去登录页</Link>
        </div>
    )
}
