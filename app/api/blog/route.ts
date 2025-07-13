import {cookies} from "next/headers";
import {NextResponse} from "next/server";

export async function GET() {
    console.log("进来了没有")
    // if (!token) {
    //     return NextResponse.json({message: "fail", code: 404})
    // }

    return NextResponse.json({message: "success", code: 200})
}