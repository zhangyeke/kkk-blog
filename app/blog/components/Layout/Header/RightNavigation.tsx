import {NavigationList} from "./NavigationList"
import {UserBrief} from "./UserBrief"
import {auth} from "@/lib/auth";
import {DarkSwitch} from "@/components/k-view";

export default async function RightNavigation() {
    const session = await auth()
    return (
        <div className={'flex items-center gap-x-4'}>
            <UserBrief session={session}/>
            <NavigationList/>
            <DarkSwitch/>
        </div>
    )
}
