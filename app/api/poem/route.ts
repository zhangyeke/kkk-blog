import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {OmitMethodConfig} from "@/lib/request";
import http from "./request-examples"

const TOKEN_KEY = 'poem-token'
// 获取token
const getPoemToken = () => http.get<{ data: string }>(`/token`, {
    next: {
        revalidate: 7000,
    },
});
// 获取今日诗词
const getTodayPoem = (config: OmitMethodConfig) => http.get(`/sentence`, {
    ...config
    // headers: {
    //     "X-User-Token": cookies.get('')
    // }
});


export async function GET() {
    const cookie = await cookies()
    let token = cookie.get(TOKEN_KEY) as string | undefined
    console.log("获取的到的", token)
    if (!token) {
        const res = await getPoemToken()
        if (res.data) {
            cookie.set(TOKEN_KEY, res.data)
            token = res.data
        } else {
            return NextResponse.json({message: "获取token失败", code: 404})
        }

    }
    const poemRes = await getTodayPoem({
        headers: {
            "X-User-Token": token
        }
    })

    console.log("今日诗词",poemRes)
    return NextResponse.json({message: "success", code: 200})
}