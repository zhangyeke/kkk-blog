"use client"
import {useSelectedLayoutSegment} from "next/navigation";
import {HEADER_BLACKS} from "@/config/blog"
import {PostCategory} from "@/types/postCategory";
import HeaderMenu from "./HaderMenu";
import {MenuContext} from "./context";
import Logo from "./Logo";

export interface HeaderProps {
    categoryList?: PostCategory[]
}

export default function Header(props: HeaderProps) {
    const segment = useSelectedLayoutSegment();
    if (segment && HEADER_BLACKS.includes(segment)) {
        return null
    }
    const fixedClassName = `fixed left-0 top-0 z-100`

    return (
        <header
            className={`bg-black/25 ${segment ? '' : fixedClassName} w-full flex justify-between items-center px-5 h-15 `}>
            <Logo/>
            <MenuContext value={props}>
                <HeaderMenu/>
            </MenuContext>
        </header>
    )
}

