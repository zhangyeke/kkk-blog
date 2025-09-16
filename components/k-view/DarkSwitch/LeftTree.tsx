"use client"
import React from "react"
import styles from "./darkSwitch.module.css"

// 树叶
const Leaf = () => {
    return (
        <div
            style={{
                borderRadius: '63% 37% 31% 69%/60% 74% 26% 40%'
            }}
            className="absolute w-6 h-7 -left-[0.6rem] -top-2 bg-[var(--tree-color)] transform rotate-[40deg]"
        ></div>
    )
}
/*树干*/
const Trunk = () => {
    return (
        <div className={`${styles.trunk} relative h-full w-1.5 bg-[var(--trunk)] z-10`}>

        </div>
    )
}

export const LeftTree = () => {
    return (
        <div className="absolute -bottom-1/4 left-1/5 h-full z-[3]">
            <Leaf></Leaf>
            <Trunk></Trunk>
        </div>
    );
};