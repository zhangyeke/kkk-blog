"use client"
import {Icon} from "@/components/k-view";
import { useWindowScroll} from "react-use";
import {useClientMounted} from "@/hooks"


export const BackTop = () => {
    const {y} = useWindowScroll();
    const isMounted = useClientMounted()
    const scrollToTop = () => {
        if (window) {
            window.scrollTo({top: 0, behavior: 'smooth'})
        }
    }
    if (!isMounted) return null
    return (
        <Icon
            className={`${y > 400 ? 'block' : 'hidden'} fixed z-50 right-5 bottom-1/8 cursor-pointer text-[2rem] hover:animate-bounce`}
            name={'back-top'} onClick={() => scrollToTop()}/>
    );
};