import { createBrowserClient } from '@supabase/ssr'
import {env} from '@/env.mjs'


export function createClient() {
    // Create a supabase client on the browser with project's credentials
    return createBrowserClient(
        env.SUPABASE_URL,
        env.SUPABASE_KEY
    )
}

export default createClient