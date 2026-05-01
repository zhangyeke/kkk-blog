/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 23:55:09
 * @FilePath: \blog\components\k-view\GradientTransition\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {cn} from "@/lib/utils";


export type GradientTransitionProps = {
    duration?: number
    defaultColor?: string
} & Partial<ContainerProps> & BaseComponentProps

export const GradientTransition = (props: GradientTransitionProps) => {
    let {
        defaultColor = 'linear-gradient(-45deg, #e8d8b9, #eccec5, #a3e9eb, #bdbdf0, #eec1ea)',
        duration = 10,
        children,
        className,
        style
    } = props;

    const gradientStyle = {
        ...style,
        backgroundImage: defaultColor,
        animationDuration: `${duration}s`,
    }

    return (
        <div
            style={gradientStyle}
            className={cn('animate-gradient-transition bg-size-[400%_400%]', className)}
        >
            {children}
        </div>
    );
};
