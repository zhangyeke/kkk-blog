import {cookies} from "next/headers";
import {withResponseHandler} from "@/lib/withResponseHandler";
import {getPoemToken, getTodayPoem} from "@/service/Poem";

const TOKEN_KEY = 'poem-token'


export const GET = withResponseHandler(async (_) => {
    const cookie = await cookies()
    let token = cookie.get(TOKEN_KEY) as string | undefined

    if (!token) {
        const res = await getPoemToken()
        if (res.data) {
            cookie.set(TOKEN_KEY, res.data)
            token = res.data
        } else {
            throw new Error('获取token失败')
        }

    }
    return await getTodayPoem({
        headers: {
            "X-User-Token": token
        }
    })
})
