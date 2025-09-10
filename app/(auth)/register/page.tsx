import {RegisterForm} from "@/components/AuthForm";
import {Metadata} from "next";
import {auth} from "@/lib/auth";
import {redirect} from "next/navigation";

export const metadata: Metadata = {
    title: '注册'
}

export default async function registerPage() {
    const session = await auth()
    if (session) {
        return redirect('/')
    }
    return <RegisterForm/>
}
