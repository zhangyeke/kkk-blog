import prisma from "@/lib/prisma"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{id: string}>
}

/** Public bookmark click counter. Invalid, disabled, and missing bookmarks are ignored. */
export async function POST(_request: Request, {params}: RouteContext): Promise<Response> {
    const {id: rawId} = await params
    const id = Number(rawId)
    if (!Number.isSafeInteger(id) || id <= 0) {
        return Response.json({code: 400, message: "书签不存在"}, {status: 400})
    }

    try {
        const result = await prisma.bookmark.updateMany({
            where: {id, status: 1},
            data: {clickCount: {increment: 1}},
        })
        if (result.count === 0) {
            return Response.json({code: 404, message: "书签不存在或已停用"}, {status: 404})
        }
        return Response.json({code: 200}, {status: 200})
    } catch (error) {
        console.error("[bookmark-click] 记录书签点击失败", error)
        return Response.json({code: 500, message: "记录点击失败"}, {status: 500})
    }
}
