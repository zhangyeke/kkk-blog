"use server"
import {env} from "env.mjs"
import {Saying} from "@/types/alApi";
import {backFailMessage, backSuccessMessage} from "@/lib/actionMessageBack";

/*
 * @Author: EDY
 * @Date: 2025/9/16
 * @LastEditors: EDY
 * @Description: 获取名言。海外默认走 official international.v1（见 https://hitokoto.cn/api ）
 * @Params:
 */
export async function getSaying(): Promise<BaseResource<Saying>> {
    try {
        const base = env.AL_API_URL.replace(/\/$/, "")
        const url = `${base}/?encode=json&charset=utf-8`
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
            next: {revalidate: 0},
        })
        if (!res.ok) {
            return backFailMessage(`名言获取失败: HTTP ${res.status}`)
        }
        const data = (await res.json()) as Saying
        if (!data?.hitokoto) {
            return backFailMessage("名言获取失败: 响应无效")
        }
        return backSuccessMessage("名言获取成功", data)
    } catch {
        return backFailMessage("名言获取失败")
    }
}