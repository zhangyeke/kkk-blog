'use server'
import {createClient} from '@/lib/supabase/server'

export interface FormParams {
    email: string;
    password: string
}

// 登录
export async function login({email, password}: FormParams) {
    const supabase = await createClient()


    return await supabase.auth.signInWithPassword({
        email,
        password,
    })

}

export async function register({email, password}: FormParams) {
    const supabase = await createClient()

    return await supabase.auth.signUp({
        email,
        password,
    })
}


// 退出登录
export async function logout() {
    const supabase = await createClient()
    return await supabase.auth.signOut()
}