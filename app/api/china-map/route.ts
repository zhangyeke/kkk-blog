import {NextRequest, NextResponse} from "next/server";
import {getChinaMapPayload, type ChinaMapScope} from "@/lib/china-map";

export async function GET(request: NextRequest) {
    const {searchParams} = new URL(request.url)
    const scope = (searchParams.get("scope") ?? "country") as ChinaMapScope
    const code = searchParams.get("code") ?? undefined

    try {
        const payload = await getChinaMapPayload(scope, code)
        return NextResponse.json(payload)
    } catch (error) {
        return NextResponse.json({
            message: error instanceof Error ? error.message : "地图数据加载失败"
        }, {
            status: 500
        })
    }
}
