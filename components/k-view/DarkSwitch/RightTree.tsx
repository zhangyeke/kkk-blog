"use client"
import styles from "./darkSwitch.module.css"
/*右边的树*/
export const RightTree = () => {
    return (
        <div className="absolute right-[15%] z-[3] bg-[var(--tree-color)] w-2.5 h-5 rounded-[80%] bottom-1/4">
            <div
                className={`${styles['right-tree-trunk']} absolute z-[2] bg-[var(--trunk)] w-1 h-3 left-1/2 -bottom-[0.3rem] rounded-[0.25rem] transform -translate-x-1/2`}>

            </div>
        </div>
    );
};

export const RightTreeTwo = () => {
    return (
        <div className={`${styles['right-tree']} absolute right-[33%] z-[3] bg-[var(--tree-color)] w-1.5 h-3.5 rounded-[80%] bottom-1/4`}>

        </div>
    )
}