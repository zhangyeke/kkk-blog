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

    const gradientStyle: StyleProperties = {
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
