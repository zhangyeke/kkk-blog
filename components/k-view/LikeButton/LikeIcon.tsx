"use client"
import React from "react"
import {debounce} from "lodash"
import {AnimatePresence, motion} from "framer-motion";
import {cn} from "@/lib/utils";
import {animations} from "./animation-setting"
import {Heart, LucideIcon} from "lucide-react";

export interface LikeIconProps extends BaseComponentProps {
    checked?: boolean;
    icon?: LucideIcon;
    activeIcon?: LucideIcon;
    activeClassName?: string// 激活时类名
    inActiveClassName?: string // 未激活时类名
    particlesClassName?: string // 点赞激活出现的粒子 类名
    onChange?: () => void;
}


export function LikeIcon(props: LikeIconProps) {
    const {
        checked = false,
        icon: Icon = Heart,
        activeIcon: ActiveIcon,
        particlesClassName = 'bg-red-500',
        activeClassName = 'text-red-500 fill-red-500',
        inActiveClassName = 'text-slate-400/60',
        className,
        style,
        onChange
    } = props

    // 使用 useMemo 创建持久的防抖函数
    const debouncedOnChange = React.useMemo(
        () => debounce(() => {
            onChange?.();
        }, 300),
        [onChange] // 仅在 onChange 改变时重新生成
    );
    const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
        // 1. 立即执行的部分（UI 相关，防止合成事件失效）
        e.preventDefault();
        e.stopPropagation();

        // 2. 调用防抖后的逻辑
        debouncedOnChange();
    };


    // 关键：组件销毁时清除计时器，防止内存泄漏或异步回调报错
    React.useEffect(() => {
        return () => {
            debouncedOnChange.cancel();
        };
    }, [debouncedOnChange]);


    return (
        <motion.div
            style={style}
            whileTap="tap"
            variants={animations.heart}
            className={cn("cursor-pointer relative size-4 flex items-center justify-center", className)}
            onClick={handleClick}
        >
            <Icon
                className={cn(
                    "transition-colors duration-300 size-4",
                    checked ? activeClassName : inActiveClassName
                )}
            />

            {/* 激活状态图标遮罩层 */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={{
                    clipPath: checked ? `inset(0% 0 0 0)` : `inset(100% 0 0 0)`,
                    scale: checked ? [1, 1.2, 1] : 1
                }}
                transition={{
                    clipPath: {type: "spring", stiffness: 400, damping: 17},
                    scale: {type: "keyframes", duration: 0.3}
                }}
            >
                {ActiveIcon ? (
                    <ActiveIcon className={cn('size-4', activeClassName)}/>
                ) : (
                    <Icon className={cn('size-4', activeClassName)}/>
                )}
            </motion.div>

            {/* 内部发光环效果 */}
            <AnimatePresence>
                {checked && (
                    <motion.div
                        key="glow"
                        className="absolute inset-0 rounded-full bg-red-500/20 w-6 h-6 -ml-1 -mt-1"
                        style={{left: '50%', top: '50%', x: '-50%', y: '-50%'}}
                        initial={animations.glow.initial}
                        animate={animations.glow.animate}
                        transition={animations.glow.transition}
                    />
                )}
            </AnimatePresence>

            {/* 修正后的粒子位置：放在图标所在的 motion.div 内部 */}
            <AnimatePresence>
                {checked && (
                    <motion.div
                        key="particles"
                        className="absolute pointer-events-none"
                        style={{left: '50%', top: '50%'}}
                        initial="initial"
                        animate="animate"
                        exit={{opacity: 0}}
                    >
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={cn("absolute w-1 h-1 rounded-full ", particlesClassName)}
                                {...animations.particle(i)}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
