import { toast } from "sonner"

import { env } from "@/env.mjs"
import { SUCCESS_CODE } from "@/lib/actionMessageBack"
import { DEFAULT_UPLOAD_ROUTE, imageUploadLimitBytes, type UploadRouteId } from "@/lib/uploads/policy"
import { uploadImage } from "@/service/fileUpload"

/** Client-side upload entry point. The server action remains authoritative. */
export async function uploadImagePromise(
  image: File,
  isToast = true,
  route: UploadRouteId = DEFAULT_UPLOAD_ROUTE,
): Promise<string> {
  try {
    if (image.size > imageUploadLimitBytes(env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT)) {
      throw new Error(`图片大小超过限制，最大可上传 ${env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}`)
    }

    const formData = new FormData()
    formData.append("file", image)
    formData.append("route", route)
    const response = await uploadImage(formData)

    if (response.code !== SUCCESS_CODE || !response.data?.url) {
      throw new Error(response.message || "图片上传失败")
    }

    return response.data.url
  } catch (error) {
    if (isToast) toast.error(error instanceof Error ? error.message : "图片上传失败")
    throw error
  }
}
