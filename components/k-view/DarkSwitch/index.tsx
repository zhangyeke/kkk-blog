"use client"
import React, {useState} from 'react';
import {useTheme} from "next-themes";
import {cn} from "@/lib/utils";
import {useClientMounted} from "@/hooks";
import {Skeleton} from "@/components/ui/skeleton";
import {LeftTree} from "./LeftTree";
import {RightTree, RightTreeTwo} from "./RightTree";
import {Star} from "./Star";
import styles from "./darkSwitch.module.css"

const getCssVar = (mode: string) => {
    const isDark = mode === 'dark';
    return {
        "--opacity": `${isDark ? 0 : 1}`,
        "--from-bgcolor": `${isDark ? "#b993d4" : "#e75f7a"}`,
        "--to-bgcolor": `${isDark ? "#e6e0ed" : "#ffb168"}`,
        "--btn-color": `${isDark ? "rgba(242, 198, 160, 0.6)" : "rgb(108 82 140 / 70%)"}`,
        "--translate-x": `${isDark ? 0 : "200%"}`,
        "--tree-color": `${isDark ? "#4c508b" : "#78177b"}`,
        "--trunk": "#3b3853",
        "--left-hill": `${isDark ? "#5c6090" : "#602291"}`,
        "--right-hill": `${isDark ? "#4b4f85" : "#511a7f"}`,
        "--sun-translate-y": `${isDark ? "2rem" : "1.25rem"}`,
    }
}


type TinySpotProps = {
    mode: string
    type: "big" | "small"
    zoom: number
}

const TinySpot = ({mode, type, zoom}: TinySpotProps) => {
    return <Star
        className={cn(styles['tiny-spot'], `${mode == "light" && (type == "big" ? "translate-y-[-1rem]" : "translate-y-[-0.75rem]")} ${type == 'small' ? "right-1/5" : "right-1/4 top-1/5"}`)}
        zoom={zoom}/>
}

/*切换圆形按钮*/
const SwitchButton = ({onTransitionEnd}: { onTransitionEnd: () => void }) => {
    return (
        <div
            className="absolute z-20 w-8 h-full rounded-full bg-[var(--btn-color)] overflow-hidden transition-all duration-[800ms] ease-in transform translate-x-[var(--translate-x)] backdrop-blur-[0.5rem]"
            onTransitionEnd={onTransitionEnd}
        ></div>
    );
};

/*小山*/
const Hills = () => {
    const hillClassName = "relative z-[2] h-10 rounded-[100%] transform rotate-[8deg]"

    return (
        <div className="relative flex w-[200%] bottom-[-60%] left-0">
            <div className={`${hillClassName} top-0.5 -left-1/4 w-[60%] bg-[var(--left-hill)] z-[2]`}></div>
            <div className={`${hillClassName} top-1.5 right-[40%] w-[40%] bg-[var(--right-hill)] z-[1]`}></div>
        </div>
    );
};

export const DarkSwitch = () => {
    const {theme, setTheme} = useTheme();
    const isMounted = useClientMounted()
    const [isDark, setIsDark] = useState(theme === 'dark')

    if (!isMounted) return <Skeleton className={styles['dark-switch-wrap']}/>

    const value = theme || "light";


    return (
        <div
            className={cn('group', styles['dark-switch-wrap'], isDark ? styles['dark-switch-wrap-dark'] : styles['dark-switch-wrap-light'])}
            onClick={() => setIsDark(!isDark)}>
            <SwitchButton onTransitionEnd={() => setTheme(value === "light" ? "dark" : "light")}/>
            <LeftTree/>
            <Hills/>

            <div
                className={cn(styles.sun, 'absolute z-0 w-5 h-5 rounded-[50%] left-[42%] bottom-[40%]', !isDark ? "ease-out" : "ease-in")}>

            </div>

            <div style={{
                transform: `translateY(${isDark ? ".3rem" : "2rem"})`
            }} className={cn(styles.moon, 'absolute bg-transparent w-4 h-4 rounded-[50%] left-[35%] top-0')}></div>

            <TinySpot zoom={0.15} type="small" mode={isDark ? 'dark' : 'light'}/>
            <TinySpot zoom={0.2} type="big" mode={isDark ? 'dark' : 'light'}/>
            <RightTree/>
            <RightTreeTwo/>

        </div>
    );
};

