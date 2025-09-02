"use server";
import Request from "@/lib/Request";
import {cookies} from "next/headers";

const TOKEN_KEY = 'poem-token'
const http = new Request({
    baseUrl: 'https://v2.jinrishici.com',
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})

// 获取token
export async function getPoemToken() {
    return await http.get<{ data: string }>(`/token`, {
        next: {
            revalidate: 7000,
        },
    });
}

// 获取今日诗词
export async function getTodayPoem() {

    const cookie = await cookies()
    let tokenCookie  = cookie.get(TOKEN_KEY)
    let token = tokenCookie?.value

    if (!token) {
        const res = await getPoemToken()
        if (res.data) {
            token = res.data
            cookie.set(TOKEN_KEY, token)
        } else {
            throw new Error('获取token失败')
        }

    }


    return await http.get(`/sentence`, {
        headers: {
            "X-User-Token": token
        }
    });

}
