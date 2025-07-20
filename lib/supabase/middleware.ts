import { createServerClient } from '@supabase/ssr'
import {NextRequest, NextResponse} from 'next/server'
import {env} from "@/env.mjs";

export async function updateSession(request:NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        env.SUPABASE_URL,
        env.SUPABASE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    await supabase.auth.getUser()

    return supabaseResponse
}