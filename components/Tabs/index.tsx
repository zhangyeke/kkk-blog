"use client"
import React, {useCallback, useState} from "react"
import {motion} from "framer-motion";
import {cn} from "@/lib/utils";

interface TabsProps<T> extends BaseComponentProps {
    items: T[]
    defaultActiveIndex?: number
    textKey?: string
    onClick?: (item: T, i: number) => void
}

export default function Tabs<T extends { id: number | string }>({
                                                                    className,
                                                                    style,
                                                                    items,
                                                                    defaultActiveIndex = 0,
                                                                    textKey = 'name',
                                                                    onClick
                                                                }: TabsProps<T>) {


    const [active, setActive] = useState(items[defaultActiveIndex]);
    const [isHover, setIsHover] = useState<T | null>(null);

    const handleClickActive = useCallback((item: T, i: number) => {
        setActive(item)
        onClick?.(item, i)
    }, [onClick])

    return (
        <ul className={cn('flex-center', className)} style={style}>
            {items.map((item, index) => (
                <button
                    key={item.id}
                    className="py-2 relative duration-300 transition-colors hover:text-foreground cursor-pointer"
                    onClick={() => handleClickActive(item, index)}
                    onMouseEnter={() => setIsHover(item)}
                    onMouseLeave={() => setIsHover(null)}
                >
                    <div className="px-5 py-2 relative">
                        {item[textKey]}
                        {isHover?.id === item.id && (
                            <motion.div
                                layoutId="hover-bg"
                                className="absolute bottom-0 left-0 right-0 w-full h-full bg-primary/10"
                                style={{borderRadius: 6}}
                            />
                        )}
                    </div>
                    {active?.id === item.id && (
                        <motion.div
                            layoutId="active"
                            className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-primary"
                        />
                    )}
                    {isHover?.id === item.id && (
                        <motion.div
                            layoutId="hover"
                            className="absolute bottom-0 left-0 right-0 w-full h-0.5 bg-primary"
                        />
                    )}
                </button>
            ))}
        </ul>
    );
}
