import {UserBrief} from "./UserBrief"
import { DarkSwitch } from "@/components/k-view/DarkSwitch";
import {cn} from "@/lib/ui/cn";
import NotLoginAvatar from "./NotLoginAvatar";
import {Session} from "next-auth";
import type { BlogAccountMenuItem } from "@/lib/blog/account-menu"

type RightNavigationProps = {
    session: Session | null
    accountMenuItems: BlogAccountMenuItem[]
} & BaseComponentProps

export default async function RightNavigation({className, style, session, accountMenuItems}: RightNavigationProps) {

    return (
        <div style={style} className={cn('flex items-center gap-x-4', className)}>
            {
                session ?
                    <UserBrief session={session} accountMenuItems={accountMenuItems}/> :
                    <NotLoginAvatar/>
            }
            {/*<NavigationList/>*/}
            <DarkSwitch/>
        </div>
    )
}
