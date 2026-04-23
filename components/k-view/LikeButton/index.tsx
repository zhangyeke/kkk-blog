"use client"
import React, {ReactNode} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {cn} from "@/lib/utils";
import {animations} from "./animation-setting"
import {LikeIcon, LikeIconProps} from "./LikeIcon";


export interface LikeButtonProps extends Omit<LikeIconProps, 'checked' | 'onChange'> {
    defaultValue?: boolean;
    initialCount?: number;
    children?: (liked: boolean) => ReactNode
    onChange?: (liked: boolean) => void;
}


export function LikeButton(props: LikeButtonProps) {
    const {
        defaultValue = false,
        icon: Icon,
        activeIcon: ActiveIcon,
        initialCount = 0,
        particlesClassName = 'bg-red-500',
        activeClassName = 'text-red-500 fill-red-500',
        inActiveClassName = 'text-slate-400/60',
        className,
        style,
        children,
        onChange
    } = props
    const [isLiked, setIsLiked] = React.useState(defaultValue);
    const [count, setCount] = React.useState(initialCount);
    const [isPending, setIsPending] = React.useState(false);

    const handleClick = async () => {
        if (isPending) return; // 防止连续点击

        // 1. 乐观更新 (Optimistic UI)
        const nextLiked = !isLiked;
        setIsLiked(nextLiked);
        setCount(prev => nextLiked ? prev + 1 : prev - 1);

        if (onChange) {
            try {
                setIsPending(true);
                // 使用 await 统一处理同步/异步
                // 如果 onToggle 是同步的，await 也会立即完成
                await onChange(nextLiked);
            } catch {
                // 2. 失败回滚
                setIsLiked(!nextLiked);
                setCount(prev => !nextLiked ? prev + 1 : prev - 1);
            } finally {
                setIsPending(false);
            }
        }
    };

    return (
        <div className="relative inline-block">
            <button
                style={style}
                className={cn("group relative flex items-center bg-white border border-slate-200 rounded-sm h-8 transition-all hover:bg-slate-50 active:border-slate-300 overflow-hidden shadow-sm", className)}
                onClick={handleClick}
            >
                {/* 图标容器 - 现在是粒子的参考点 */}
                <div className="pl-3.5 pr-2 flex items-center justify-center relative">
                    <LikeIcon
                        checked={isLiked}
                        icon={Icon}
                        activeIcon={ActiveIcon}
                        inActiveClassName={inActiveClassName}
                        activeClassName={activeClassName}
                        particlesClassName={particlesClassName}
                    />
                </div>

                {
                    children && (
                        <span className={cn(
                            "text-sm px-2 transition-colors",
                            isLiked ? activeClassName : inActiveClassName
                        )}>
                            {children(isLiked)}
                        </span>
                    )
                }

                <div
                    className="h-full px-4 flex items-center bg-slate-50/80 border-l border-slate-100 text-xs font-bold text-slate-500">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={count}
                            variants={animations.count}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{duration: 0.15}}
                        >
                            {count}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </button>
        </div>
    );
}