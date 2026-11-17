"use client"

/**
 * 高德 JS API 2.0 加载器。
 *
 * key 由 Server Component 通过 prop 传入（服务端变量，不进客户端 bundle）。
 * 脚本只加载一次，后续调用复用同一个 Promise。
 */

export interface AMapMarkerInstance {
    setPosition: (position: [number, number]) => void
    setContent: (content: HTMLElement | string) => void
    setMap: (map: AMapMapInstance | null) => void
    on: (event: string, handler: () => void) => void
}

export interface AMapMapInstance {
    on: (event: string, handler: () => void) => void
    off: (event: string, handler: () => void) => void
    destroy: () => void
    getZoom: () => number
    setZoomAndCenter: (zoom: number, center: [number, number]) => void
    /** 切换底图样式，传 `amap://styles/<name>` */
    setMapStyle: (style: string) => void
    lngLatToContainer: (position: [number, number]) => { x: number; y: number }
    add: (overlay: unknown) => void
    remove: (overlay: unknown) => void
    setFitView: (overlays?: unknown[], immediately?: boolean, avoid?: number[]) => void
}

export interface AMapNamespace {
    Map: new (container: HTMLElement, options?: Record<string, unknown>) => AMapMapInstance
    Marker: new (options?: Record<string, unknown>) => AMapMarkerInstance
    Pixel: new (x: number, y: number) => unknown
    /** 图层：卫星影像与路网标注 */
    TileLayer: {
        Satellite: new (options?: Record<string, unknown>) => unknown
        RoadNet: new (options?: Record<string, unknown>) => unknown
    }
}

type AMapWindow = Window & {
    AMap?: AMapNamespace
}

const SCRIPT_ID = "amap-jsapi-v2"

let loading: Promise<AMapNamespace> | null = null

export function loadAMap(apiUrl: string, key: string): Promise<AMapNamespace> {
    const w = window as AMapWindow

    if (w.AMap) return Promise.resolve(w.AMap)
    if (loading) return loading

    let scriptUrl: URL
    try {
        scriptUrl = new URL(apiUrl)
    } catch {
        return Promise.reject(new Error("高德地图 JS API 地址无效"))
    }
    if (!key || scriptUrl.protocol !== "https:" || scriptUrl.hostname !== "webapi.amap.com" || scriptUrl.pathname !== "/maps") {
        return Promise.reject(new Error("请配置有效的高德地图 JS API 地址和 Key"))
    }
    scriptUrl.searchParams.set("key", key)

    loading = new Promise<AMapNamespace>((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
        if (existing) {
            existing.addEventListener("load", () => resolve(w.AMap as AMapNamespace))
            existing.addEventListener("error", () => reject(new Error("高德地图脚本加载失败")))
            return
        }

        const script = document.createElement("script")
        script.id = SCRIPT_ID
        script.async = true
        script.src = scriptUrl.toString()
        script.onload = () => {
            if (w.AMap) resolve(w.AMap)
            else reject(new Error("高德脚本已加载但未挂载 AMap"))
        }
        script.onerror = () => {
            loading = null
            reject(new Error("高德地图脚本加载失败，请检查网络或 key 域名白名单"))
        }
        document.head.appendChild(script)
    })

    return loading
}
