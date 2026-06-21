import {UserBrief} from "./UserBrief"
import {DarkSwitch} from "@/components/k-view"
import {cn} from "@/lib/utils";
import NotLoginAvatar from "./NotLoginAvatar";
import {Session} from "next-auth";

type RightNavigationProps = {
    session: Session | null
} & BaseComponentProps

export default async function RightNavigation({className, style, session}: RightNavigationProps) {

    return (
        <div style={style} className={cn('flex items-center gap-x-4', className)}>
            {
                session ?
                    <UserBrief session={session}/> :
                    <NotLoginAvatar/>
            }
            {/*<NavigationList/>*/}
            <DarkSwitch/>
        </div>
    )
}
