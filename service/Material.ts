import Request from "@/lib/Request"
import {FetchMaterialParams, MaterialResource, PhotoMaterial, VideoMaterial} from "@/types/Material";

const http = new Request({
    baseUrl: 'https://pixabay.com',
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})

// https://pixabay.com/api/docs/#api_search_videos 传参参考
const APIKEY = "43302062-211153aa0904393a2dd92a4b2"


const requestConfig = {
    next: {
        revalidate: 7000,
    },
}
// 获取图片素材
export async function fetchPhotoWall   (params?: Partial<FetchMaterialParams>) {

    return await http.get<MaterialResource<PhotoMaterial>>('/api/', {
        params: {
            key: APIKEY,
            ...params,
        },
        ...requestConfig,
    })
}


// 获取视频素材
export async function fetchVideoMaterial(params?: Partial<FetchMaterialParams>) {
    return await http.get<MaterialResource<VideoMaterial>>('/api/videos/', {
        params: {
            key: APIKEY,
            ...params,
        },
        ...requestConfig,
    })
}