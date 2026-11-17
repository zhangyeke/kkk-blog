"use server"

import { env } from "@/env.mjs"
import { ActionError, backAuthFailMessage, backMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { imageFileExtension, imageUploadLimitBytes } from "@/lib/uploads/policy"
import { checkAuth } from "@/service/auth"
import type { UploadImageResult } from "@/types/file"

/** 单次上游请求超时 */
const UPLOAD_TIMEOUT_MS = 15000

/** 默认图床（imgbb 兼容接口）的上传地址 */
function defaultEndpoint() {
  return `${env.IMGBB_API_URL.replace(/\/$/, "")}/api/v3/upload`
}

/**
 * 线路解析：客户端只能传固定 id，真实地址一律由服务端环境变量决定。
 * 未传或传了非法值时，回退到默认线路（备用图床主节点）。
 */
function resolveUploadRoute(requested: unknown) {
  if (requested === "default") return { provider: "default" as const, endpoint: defaultEndpoint() }
  if (requested === "mtbed-secondary")
    return { provider: "mtbed" as const, endpoint: env.MTBED_UPLOAD_URL_SECONDARY }
  return { provider: "mtbed" as const, endpoint: env.MTBED_UPLOAD_URL_PRIMARY }
}

/**
 * 备用源按来源头做防盗链校验：不带 Referer/Origin 时主备节点都会直接返回 403，
 * 带上后返回 200 与图片地址。仅用于该第三方源，不影响默认源。
 */
const MTBED_SOURCE = {
  referer: "https://695402.xyz/mt/",
  origin: "https://695402.xyz",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
} as const
const MTBED_MAX_BYTES = 20 * 1024 * 1024
const imageMimeTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
  heic: "image/heic",
} as const

export async function uploadImage(params: FormData): Promise<UploadImageResult> {
  // Authenticate before reading image bytes or sending anything upstream.
  try {
    await checkAuth()
  } catch {
    return backAuthFailMessage("请先登录再上传图片", null)
  }

  try {
    if (!(params instanceof FormData)) throw new ActionError("上传参数不正确", 400)
    const file = params.get("file")
    if (!(file instanceof File) || file.size === 0) throw new ActionError("请选择非空的图片文件", 400)

    const { provider, endpoint } = resolveUploadRoute(params.get("route"))
    const configuredLimit = imageUploadLimitBytes(env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT)
    const maxBytes = provider === "mtbed" ? Math.min(configuredLimit, MTBED_MAX_BYTES) : configuredLimit
    if (file.size > maxBytes) {
      throw new ActionError(`图片超过大小限制，最大 ${maxBytes / 1024 / 1024} MB`, 413)
    }
    const extension = imageFileExtension(new Uint8Array(await file.slice(0, 32).arrayBuffer()))
    if (!extension) throw new ActionError("不支持该图片格式，请使用 PNG、JPEG、GIF、WebP、BMP、ICO 或 HEIC 图片", 415)

    const body = new FormData()
    // The third-party page uses 'image'; the existing provider uses 'file'.
    body.append(
      provider === "mtbed" ? "image" : "file",
      new Blob([file], { type: imageMimeTypes[extension] }),
      `upload.${extension}`
    )
    const headers: Record<string, string> = { Accept: "application/json" }
    if (provider === "mtbed") {
      headers.Referer = MTBED_SOURCE.referer
      headers.Origin = MTBED_SOURCE.origin
      headers["User-Agent"] = MTBED_SOURCE.userAgent
    } else {
      headers.Authorization = `Bearer ${env.IMGBB_API_TOKEN}`
      body.append("params", JSON.stringify({ dedup: true, album_id: 1516 }))
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new ActionError(
        response.status === 403
          ? "图床拒绝了上传请求（403），请联系管理员检查上传源配置"
          : `图床上传失败（HTTP ${response.status}），请稍后重试`,
        502
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch (error) {
      if (isUploadTimeout(error)) throw error
      throw new ActionError("图床返回的内容不是有效的 JSON，请联系管理员检查上传源", 502)
    }
    if (!isUploadResponse(payload)) throw new ActionError("图床未返回有效的图片地址", 502)
    return backSuccessMessage("图片上传成功", { url: payload.data.url })
  } catch (error) {
    // Return serializable errors; production Server Actions hide thrown Error messages.
    if (error instanceof ActionError) return backMessage(error.code, error.message, null)
    if (isUploadTimeout(error)) {
      return backMessage(504, "图片上传超时，请稍后重试", null)
    }
    return backMessage(502, "图片上传服务暂不可用，请稍后重试", null)
  }
}

function isUploadTimeout(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "name" in error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  )
}

function isUploadResponse(value: unknown): value is { code: 200; data: { url: string } } {
  if (!value || typeof value !== "object" || !("code" in value) || value.code !== 200 || !("data" in value))
    return false
  const data = value.data
  if (!data || typeof data !== "object" || !("url" in data) || typeof data.url !== "string") return false
  try {
    const url = new URL(data.url)
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
  } catch {
    return false
  }
}
