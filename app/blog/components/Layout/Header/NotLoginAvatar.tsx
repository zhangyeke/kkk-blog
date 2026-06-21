import Link from "next/link";
import {Image} from "@/components/k-view";
import {cn} from "@/lib/utils";

export default function NotLoginAvatar({className}:BaseComponentProps) {

    return (
        <Link href={"/login"}>
            <Image className={cn("size-10 rounded-full",className)} fallback={"登录"}/>
        </Link>
    )
}
