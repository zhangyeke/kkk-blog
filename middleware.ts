// middleware.ts
import type {NextRequest} from 'next/server';
import {NextResponse} from "next/server";

// 允许通过的白名单
const allowedOrigins = ['https://acme.com', 'http://localhost:3000']
// 服务器可允许的请求方式 和 请求头头
const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function middleware(request: NextRequest) {
    // const requestHeaders = new Headers(request.headers)
    // requestHeaders.set('x-hello-from-middleware1', 'hello')
    const response = NextResponse.next()
    const pathname = request.nextUrl.pathname;
    response.headers.set('k-pathname', pathname)
    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}