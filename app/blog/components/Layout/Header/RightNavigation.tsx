import {NavigationList} from "./NavigationList"
import {UserBrief} from "./UserBrief"
import {DarkSwitch, Image} from "@/components/k-view";
import React from "react";
import Link from "next/link";
import {auth} from "@/lib/auth";

export default async function RightNavigation() {
    const session = await auth()
    return (
        <div className={'flex items-center gap-x-4'}>
            {
                session ?
                    <UserBrief session={session}/> :
                    <Link href={"/login"}>
                        <Image className={"size-10 rounded-full"} fallback={"登录"}/>
                    </Link>
            }
            {/*<NavigationList/>*/}
            <DarkSwitch/>
        </div>
    )
}
