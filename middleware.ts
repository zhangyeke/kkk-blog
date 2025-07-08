// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest,NextFetchEvent } from 'next/server';

// 允许通过的白名单
const allowedOrigins = ['https://acme.com', 'http://localhost:3000']
// 服务器可允许的请求方式 和 请求头头
const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export function middleware(request: NextRequest,event:NextFetchEvent) {
    const response = NextResponse.next()
    return response
}

export const config = {
    // matcher:[],
}