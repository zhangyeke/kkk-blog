"use server"
import {env} from "env.mjs"
import {UploadImageResponse} from "@/types/file";

export async function uploadImage(params: FormData) {
    try {
        const res = await fetch(`${env.IMGBB_API_URL}/api/v3/upload`, {
            method: "post",
            headers: {
                Authorization: `Bearer ${env.IMGBB_API_TOKEN}`,
                // 'Content-Type': 'multipart/form-data', // 告诉服务器我们发送的是 JSON 格式数据
                // 'Accept': 'application/json' // 可选：告诉服务器我们期望接收 JSON 格式数据
            },
            body: params,
        })
        const data = await res.json() as UploadImageResponse
        if (data.code && data.code === 200) {
            return data.data
        } else {

            return Promise.reject(new Error('图片上传失败'))
        }


    } catch (err) {
        console.error("图片上传失败", err)
    }

}


