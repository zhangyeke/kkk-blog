"use server"
import {env} from "env.mjs"
import {UploadImageResponse} from "@/types/file";
import {backSuccessMessage} from "@/lib/actionMessageBack";

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
    } catch {
        return Promise.reject(new Error('图片上传失败'))
    }

}

/*
interface UploadResult {
    Jobs: string;
    Name: string;
    os: string;
}
export async function uploadToMeituan(
    formData: FormData
): Promise<UploadResult> {
    const file = formData.get("file");

    if (!(file instanceof File)) {
        throw new Error("No file uploaded");
    }


    // 转发上传
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    const response = await fetch(
        "https://pic-up.meituan.com/extrastorage/new/video?isHttps=true",
        {
            method: "POST",
            headers: {
                "client-id": "p5gfsvmw6qnwc45n000000000025bbf1",
                "token": token,
                "Origin": "https://czz.meituan.com",
                "Referer": "https://czz.meituan.com/"
            },
            body: uploadForm
        }
    );

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
        throw new Error("Upload failed");
    }

    return {
        Jobs: data.data.originalLink,
        Name: data.data.originalFileName,
        os: "node-oss.zai1.com"
    };
}



*/
