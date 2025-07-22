import HeaderMenu from "./HaderMenu"
import Logo from "./Logo";
export default async function Header() {


    return (
        <header className={"fixed left-0 top-0 z-100 w-full flex items-center px-5 h-15 bg-white/50"}>
            <Logo/>
            <HeaderMenu className={"ml-auto"}></HeaderMenu>
        </header>
    )
}

