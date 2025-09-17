"use server"
import {env} from "env.mjs"
import {Saying, SayingResource} from "@/types/alApi";

/*
 * @Author: EDY
 * @Date: 2025/9/16
 * @LastEditors: EDY
 * @Description: 获取名言 https://developer.hitokoto.cn/sentence/
 * @Params:
 */
export async function getSaying() {
    try {
        const res = await fetch(`https://v1.hitokoto.cn?encode=json`, {
            method: "get",
            headers: {
                'Content-Type': 'application/json', // 告诉服务器我们发送的是 JSON 格式数据
                'Accept': 'application/json' // 可选：告诉服务器我们期望接收 JSON 格式数据
            },
        })
        return await res.json() as Saying
    } catch (err) {
        console.log("名言获取失败", err)
    }

}