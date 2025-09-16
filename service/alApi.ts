"use server"
import {env} from "env.mjs"
import {SayingResource} from "@/types/alApi";

/*
 * @Author: EDY
 * @Date: 2025/9/16
 * @LastEditors: EDY
 * @Description: 获取名言警句 https://www.alapi.cn/api/5/api_document
 * @Params:
 */
export async function getSaying() {
    try {
        const res = await fetch(`${env.AL_API_URL}/api/mingyan`, {
            method: "post",
            headers: {
                'Content-Type': 'application/json', // 告诉服务器我们发送的是 JSON 格式数据
                'Accept': 'application/json' // 可选：告诉服务器我们期望接收 JSON 格式数据
            },
            body: JSON.stringify({
                token: env.AL_API_TOKEN,
                format: "json"
            })
        })
        return await res.json() as SayingResource
    } catch (err) {
        console.log(err)
    }

}