"use server";
import Request, {OmitMethodConfig} from "@/lib/Request";

const http = new Request({
    baseUrl: 'https://v2.jinrishici.com',
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})
// 获取token
export async function getPoemToken  () {
    return await http.get<{ data: string }>(`/token`, {
        next: {
            revalidate: 7000,
        },
    });
}
// 获取今日诗词
export async function getTodayPoem  (config: OmitMethodConfig) {
    return await http.get(`/sentence`, {
        ...config
    });

}
