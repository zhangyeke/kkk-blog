import "server-only"

import { getAdminSettingValues } from "@/lib/admin/settings-store"

const AMAP_SETTING_GROUP = "gaode_map_config"

export type AMapSettings = {
  jsKey: string
  jsUrl: string
  webKey: string
  webUrl: string
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function readEndpoint(value: unknown, hostname: string, pathname: string): string {
  const source = readString(value)
  if (!source) return ""

  try {
    const url = new URL(source)
    if (
      url.protocol !== "https:" ||
      url.hostname !== hostname ||
      url.pathname !== pathname ||
      url.username ||
      url.password ||
      url.hash
    ) {
      return ""
    }
    return url.toString()
  } catch {
    return ""
  }
}

/** Read the AMap credentials and endpoints from the admin settings group. */
export async function getAMapSettings(): Promise<AMapSettings> {
  const values = await getAdminSettingValues(AMAP_SETTING_GROUP)
  return {
    jsKey: readString(values.api_js_key),
    jsUrl: readEndpoint(values.gaode_api_js_url, "webapi.amap.com", "/maps"),
    webKey: readString(values.gaode_web_key),
    webUrl: readEndpoint(values.gaode_web_url, "restapi.amap.com", "/v3/geocode/geo"),
  }
}
