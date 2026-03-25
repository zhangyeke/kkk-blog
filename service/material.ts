import {env} from "env.mjs"
import Request from "@/lib/Request"
import {FetchMaterialParams, MaterialResource, PhotoMaterial, VideoMaterial} from "@/types/material";

const http = new Request({
    baseUrl: env.MATERIAL_API_URL,
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})

const requestConfig = {
    next: {
        revalidate: 7000,
    },
}
// https://pixabay.com/api/docs/#api_search_videos 传参参考
// 获取图片素材
export async function fetchPhotoWall(params?: Partial<FetchMaterialParams>) {

    return await http.get<MaterialResource<PhotoMaterial>>('/api/', {
        params: {
            key: env.MATERIAL_API_TOKEN,
            ...params,
        },
        ...requestConfig,
    })
}


// 获取视频素材
export async function fetchVideoMaterial(params?: Partial<FetchMaterialParams>) {
    return await http.get<MaterialResource<VideoMaterial>>('/api/videos/', {
        params: {
            key: env.MATERIAL_API_TOKEN,
            ...params,
        },
        ...requestConfig,
    })
}