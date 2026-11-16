"use server"

import { env } from "env.mjs"
import { z } from "zod"

import { backFailMessage, backSuccessMessage } from "@/lib/actionMessageBack"
import { gcj02ToWgs84, isDomesticAdcode } from "@/lib/geo/coords"
import { checkAuth } from "@/service/auth"
import { getRegionPathLabels } from "@/service/china-map"

const geocodeRequestSchema = z.object({
  address: z.string().trim().min(1, "请先填写地点").max(500, "地点长度不能超过 500 字"),
  regionCode: z.array(z.string().regex(/^\d{6}$/, "请选择有效地区")).min(2, "请先选择省和市").max(3),
})

type AMapGeocodeResponse = {
  status?: string
  info?: string
  infocode?: string
  geocodes?: Array<{ location?: string; level?: string }>
}

function getAMapErrorMessage(infocode?: string) {
  if (infocode === "10001" || infocode === "10009") {
    return "高德 Web 服务 Key 无效或平台类型不匹配，请检查 GAODI_WEB_SERVICE_KEY 配置。"
  }
  if (infocode === "10002" || infocode === "10012") {
    return "当前高德 Key 没有地理编码服务权限。"
  }
  if (infocode === "10005") {
    return "高德 Key 的服务器 IP 白名单未包含当前服务 IP。"
  }
  return "高德地理编码暂不可用，请稍后重试。"
}

/** 根据所选地区和详细地点调用高德地址地理编码，并返回项目存储使用的 WGS-84 坐标。 */
export async function geocodeFootprintAddress(input: unknown) {
  try {
    await checkAuth()

    const parsed = geocodeRequestSchema.safeParse(input)
    if (!parsed.success) {
      return backFailMessage(parsed.error.issues[0]?.message ?? "请填写有效的地点和地区", null)
    }

    const key = env.GAODI_WEB_SERVICE_KEY?.trim()
    if (!key) {
      return backFailMessage("请配置高德 Web 服务 API Key（GAODI_WEB_SERVICE_KEY）", null)
    }

    const { address, regionCode } = parsed.data
    const [regionPath] = await getRegionPathLabels([regionCode])
    const regionNames = regionPath?.split(" / ") ?? []
    if (
      regionNames.length !== regionCode.length ||
      regionNames.some((name, index) => !name || name === regionCode[index])
    ) {
      return backFailMessage("地区名称加载失败，请稍后重试", null)
    }

    const query = new URLSearchParams({
      key,
      address: `${regionNames.join("")}${address}`,
      city: regionNames[1] ?? regionNames[0]!,
      output: "JSON",
    })
    const response = await fetch(`https://restapi.amap.com/v3/geocode/geo?${query.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      return backFailMessage("高德地理编码服务连接失败，请稍后重试", null)
    }

    const result = (await response.json()) as AMapGeocodeResponse
    if (result.status !== "1") {
      return backFailMessage(getAMapErrorMessage(result.infocode), null)
    }

    const location = result.geocodes?.find((item) => typeof item.location === "string")?.location
    if (!location) {
      return backFailMessage("没有找到匹配的地点，请补充更详细的地址", null)
    }

    const coordinateParts = location.split(",")
    if (coordinateParts.length !== 2 || coordinateParts.some((part) => !part.trim())) {
      return backFailMessage("高德返回的坐标格式无效，请稍后重试", null)
    }

    const [amapLng, amapLat] = coordinateParts.map(Number)
    if (
      amapLng === undefined ||
      amapLat === undefined ||
      !Number.isFinite(amapLng) ||
      !Number.isFinite(amapLat) ||
      amapLng < -180 || amapLng > 180 ||
      amapLat < -90 || amapLat > 90
    ) {
      return backFailMessage("高德返回的坐标格式无效，请稍后重试", null)
    }

    const [lng, lat] = isDomesticAdcode(Number(regionCode[0]))
      ? gcj02ToWgs84(amapLng, amapLat)
      : [amapLng, amapLat]

    return backSuccessMessage("地点坐标获取成功", { lng, lat })
  } catch {
    return backFailMessage("地点坐标获取失败，请检查网络后重试", null)
  }
}
