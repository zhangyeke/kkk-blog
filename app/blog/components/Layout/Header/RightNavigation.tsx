import {NavigationList} from "./NavigationList"
import {UserBrief} from "./UserBrief"
import {DarkSwitch} from "@/components/k-view";
import React from "react";

export default async function RightNavigation() {

    return (
        <div className={'flex items-center gap-x-4'}>
            <UserBrief/>
            <NavigationList/>
            <DarkSwitch/>
        </div>
    )
}
