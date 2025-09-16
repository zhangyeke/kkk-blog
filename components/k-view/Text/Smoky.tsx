"use client"
import React from "react"
import {cn} from "@/lib/utils";


// 烟雾消失动画组件
export interface SmokyProps extends BaseComponentProps {
    content?: string;
    // 动画持续时间
    duration?: number;
    // 延迟
    delay?: number;
    // 文本颜色
    color?: string;
    onSmokyEnd?: (length: number) => void;
}

type SmokyTextProps = {
    enter: boolean;
    index: number
} & Pick<SmokyProps, 'duration' | 'delay'> & ContainerProps

function SmokyText(props: SmokyTextProps) {
    const {enter, index, duration, delay, color, children} = props;

    const textStyle: StyleProperties = {
        '--color': color,
        textShadow: ` 0 0 0 var(--color)`,
        backfaceVisibility: 'hidden',
        animationDuration: `${enter ? 2 : duration}s`,
        animationDelay: `${enter ? 0 : delay}s`,
    }

    return <span className={cn('inline-flex text-transparent', enter ? 'animate-fade-in' : 'animate-smoky')}
                 style={textStyle} data-index={index}>{children}</span>
}

export function Smoky(props: SmokyProps) {
    const {
        content = "文本内容",
        duration = 3,
        delay = 5,
        color = '#000',
        className,
        style,
        onSmokyEnd
    } = props
    const texts = content.split("");
    // 组件进入
    const [isEnter, setIsEnter] = React.useState(true);

    const handleAnimationEnd = (e: React.AnimationEvent) => {
        let index = (e.target as HTMLElement).dataset.index as string;

        if (Number(index) >= texts!.length - 1) {
            if (isEnter) {
                setIsEnter(false);
            } else {
                onSmokyEnd && onSmokyEnd(texts!.length);
                setIsEnter(true);
            }
        }

    }

    return (
        <div className={cn('', className)} style={style} onAnimationEnd={handleAnimationEnd}>
            {texts?.map((item, index) => (
                <SmokyText
                    key={index}
                    enter={isEnter}
                    duration={duration}
                    color={color}
                    index={index}
                    delay={(index * 0.1) + delay}
                >{item}</SmokyText>
            ))}
        </div>
    )
}
