import {redirect} from "next/navigation"
import {auth} from "@/lib/auth"
import {LoginForm} from "@/components/AuthForm";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: '登录'
}


export default async function loginPage({searchParams}: PageSearchParams<{ callbackUrl?: string }>) {
    const session = await auth()
    const pageParams = await searchParams
    const callbackUrl = pageParams.callbackUrl || '/'
    if (session) {
        return redirect(callbackUrl)
    }

    return <LoginForm callbackUrl={callbackUrl}/>
}
