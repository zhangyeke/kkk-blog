import {redirect} from "next/navigation"
import {Metadata} from "next";
import {auth} from "@/lib/auth"
import LoginForm from "../components/LoginForm";

export const metadata: Metadata = {
    title: '登录'
}


export default async function loginPage({searchParams}: PageSearchParams<{ callbackUrl?: string; error?: string }>) {
    const session = await auth()
    const pageParams = await searchParams
    const callbackUrl = pageParams?.callbackUrl || '/'
    const authError = pageParams?.error
    if (session) {
        return redirect(callbackUrl)
    }

    return <LoginForm authError={authError} callbackUrl={callbackUrl}/>
}
