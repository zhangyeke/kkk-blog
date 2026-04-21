import {Spinner, SpinnerProps} from "./Spinner";

export interface SpinProps extends SpinnerProps {
    fix?: boolean
}


export function FixSpin(props: SpinProps) {
    const {className, style, fix = true, text} = props
    return (
        <div
            className={`${
                fix ? 'absolute' : 'fixed'
            } left-0 top-0 bottom-0 right-0  bg-white/50  flex-center flex-col z-[1000]`}
        >
            <Spinner text={text} className={className} style={style}/>
        </div>
    );
}