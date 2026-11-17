import "server-only"

import { getAdminSettingValues } from "@/lib/admin/settings-store"

const AMAP_SETTING_GROUP = "gaode_map_config"
// The existing production settings group was created with this stable key typo.
// Keep it as a fallback so its saved values remain readable without a data migration.
const LEGACY_AMAP_SETTING_GROUP = "gaodi_map_config"

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
  const [values, legacyValues] = await Promise.all([
    getAdminSettingValues(AMAP_SETTING_GROUP),
    getAdminSettingValues(LEGACY_AMAP_SETTING_GROUP),
  ])

  const readSetting = (key: string) => readString(values[key]) || readString(legacyValues[key])
  const readConfiguredEndpoint = (key: string, hostname: string, pathname: string) =>
    readEndpoint(values[key], hostname, pathname) || readEndpoint(legacyValues[key], hostname, pathname)

  return {
    jsKey: readSetting("api_js_key"),
    jsUrl: readConfiguredEndpoint("gaode_api_js_url", "webapi.amap.com", "/maps"),
    webKey: readSetting("gaode_web_key"),
    webUrl: readConfiguredEndpoint("gaode_web_url", "restapi.amap.com", "/v3/geocode/geo"),
  }
}
