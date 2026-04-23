"use server";
import {env} from "env.mjs"
import Request from "@/lib/Request";
import {PoemResponse} from "@/types/Poem";

const http = new Request({
    baseUrl: env.POEM_API_URL,
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})

// 获取token
export async function getPoemToken() {
    return await http.get<{ data: string }>(`/token`, {
        next: {
            revalidate: 86400,
        },
    });
}

// 获取今日诗词
export async function getTodayPoem() {
    try {
        const tokenRes = await getPoemToken()
        const token = tokenRes.data
        return await http.get<PoemResponse>(`/sentence`, {
            headers: {
                "X-User-Token": token
            },
            next: {
                revalidate: 44640,
            },
        });
    } catch {
        return null
    }

}
