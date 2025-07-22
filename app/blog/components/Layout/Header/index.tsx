import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import HeaderMenu from "./HaderMenu"
import Logo from "./Logo";
export default async function Header() {


    return (
        <header className={"flex items-center px-5 h-15 bg-black/50"}>
            <Logo/>
            <HeaderMenu className={"ml-auto"}></HeaderMenu>
            <Avatar className={"ml-2"}>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>登录</AvatarFallback>
            </Avatar>
        </header>
    )
}

