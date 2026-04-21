"use server"
import {env} from "env.mjs"
import {Saying} from "@/types/alApi";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";

/*
 * @Author: EDY
 * @Date: 2025/9/16
 * @LastEditors: EDY
 * @Description: 获取名言 https://developer.hitokoto.cn/sentence/
 * @Params:
 */
export async function getSaying(): Promise<BaseResource<Saying>> {
    try {
        const res = await fetch(`${env.AL_API_URL}?encode=json`, {
            method: "get",
            headers: {
                'Content-Type': 'application/json', // 告诉服务器我们发送的是 JSON 格式数据
                'Accept': 'application/json' // 可选：告诉服务器我们期望接收 JSON 格式数据
            },
        })
        const data = await res.json() as Saying
        return backSuccessMessage('名言获取成功', data)
    } catch {
        return backFailMessage("名言获取失败")
    }

}