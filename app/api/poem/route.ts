import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import Request, {OmitMethodConfig} from "@/lib/Request";


const getBaseURL = (version: number = 2) => `https://v${version}.jinrishici.com`;

const http = new Request({
    baseUrl: getBaseURL(),
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})


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
    try {
        const cookie = await cookies()
        let token = cookie.get(TOKEN_KEY) as string | undefined

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
        return NextResponse.json({message: "success", code: 200, data: poemRes})
    } catch (err) {
        return NextResponse.json({message: "诗词获取失败", code: 500, data: err})
    }

}