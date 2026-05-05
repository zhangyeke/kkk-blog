/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-05 19:49:47
 * @FilePath: \blog\proxy.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// middleware.ts
import type {NextRequest} from 'next/server';
import {NextResponse} from "next/server";
import {auth} from "@/lib/auth";

// 允许通过的白名单
const allowedOrigins = ['https://acme.com', 'http://localhost:3000']
// 服务器可允许的请求方式 和 请求头头
const corsOptions = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/*需要登录才能访问的路由
拦截文章详情:  /^\/blog\/article\/\d+(\/\d+)*$/
*/
const protectedRoutes = ['/blog/article/write',/^\/admin($|\/.*)/, /^\/blog\/me($|\/.*)/]

export async function proxy(request: NextRequest) {
    // const requestHeaders = new Headers(request.headers)
    // requestHeaders.set('x-hello-from-middleware1', 'hello')
    // const response = NextResponse.next()
    const {pathname} = request.nextUrl;
    // response.headers.set('k-pathname', pathname)
    /*拦截需要登录才能访问的路由*/
    const session = await auth()
    const isProtected = protectedRoutes.some(route => {
        if (route instanceof RegExp) {
            return route.test(pathname)
        }
        return route === pathname
    })
    if (isProtected && !session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
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