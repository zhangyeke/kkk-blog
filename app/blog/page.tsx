import {Metadata} from "next"
import Link from "next/link";

export const metadata: Metadata = {

}


export default async function Web() {

    return (
        <div className="text-primary">
            <Link href={'/blog/login'}>去登录页</Link>
        </div>
    )
}
