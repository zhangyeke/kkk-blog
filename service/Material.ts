import Request from "@/lib/Request"

const http = new Request({
    baseUrl: 'https://pixabay.com',
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})

// https://pixabay.com/api/docs/#api_search_videos 传参参考
const APIKEY = "43302062-211153aa0904393a2dd92a4b2"

export interface MaterialResource<T> {
    total: number;
    totalHits: number;
    hits: T[];
}

// 素材参数
export interface FetchMaterialParams {
    //URL 编码的搜索词。如果省略，则返回所有图像。此值不能超过 100 个字符。
    q: string;
    // 要搜索的语言的语言代码。
    lang: 'cs' | 'da' | 'de' | 'en' | 'es' | 'fr' | 'id' | 'it' | 'hu' | 'nl' | 'no' | 'pl' | 'pt' | 'ro' | 'sk' | 'fi' | 'sv' | 'tr' | 'vi' | 'th' | 'bg' | 'ru' | 'el' | 'ja' | 'ko' | 'zh';
    // 按 ID 检索单个图像。
    id: string;
    // 按图像类型筛选结果。
    image_type: "all" | "photo" | "illustration" | "vector";
    // 图像是宽于高度，还是高于宽度。
    orientation: "all" | "horizontal" | "vertical";
    // 按类别筛选结果。接受的值： 背景， 时尚， 自然， 科学， 教育， 感情， 健康， 人， 宗教， 地方， 动物， 行业， 计算机， 食品， 体育， 交通， 旅行， 建筑物， 商业， 音乐
    category: string;
    //最小图像宽度。
    min_width: number;
    // 最小图像高度。
    min_height: number;
    // 按颜色属性筛选图像。逗号分隔的值列表可用于选择多个属性
    colors: "grayscale" | "transparent" | "red" | "orange" | "yellow" | "green" | "turquoise" | "blue" | "lilac" | "pink" | "white" | "gray" | "black" | "brown";
    // 选择获得 Editor's Choice 奖的图像。
    editors_choice: boolean;
    // 指示只应返回适合所有年龄段的图像。
    safesearch: boolean;
    // 结果应如何排序。
    order: "popular" | "latest";
    // 分页页码
    page: number;
    // 每页返回数量
    per_page: number;
}

// 图片响应字段
export interface PhotoMaterial {
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    previewURL: string;
    previewWidth: number;
    previewHeight: number;
    webformatURL: string;
    webformatWidth: number;
    webformatHeight: number;
    largeImageURL: string;
    imageWidth: number;
    imageHeight: number;
    imageSize: number;
    views: number;
    downloads: number;
    collections: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
    noAiTraining: boolean;
    isAiGenerated: boolean;
    isGRated: boolean;
    isLowQuality: number;
    userURL: string;
}

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

export interface VideoResource {
    url: string;
    width: number;
    height: number;
    size: number;
    thumbnail: string;
}


export interface VideoMaterial {
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    duration: number;
    videos: {
        large: VideoResource;
        medium: VideoResource;
        small: VideoResource;
        tiny: VideoResource;
    };
    views: number;
    downloads: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
    noAiTraining: boolean;
    isAiGenerated: boolean;
    isGRated: boolean;
    isLowQuality: number;
    userURL: string;
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