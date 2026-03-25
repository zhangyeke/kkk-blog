import {Loader} from "lucide-react"
import {cn} from "@/lib/utils";

export interface SpinnerProps extends BaseComponentProps {
    text?: string
}

const Spinner = ({text, className, style}: SpinnerProps) => {
    return (
        <div className={'flex-center flex-col text-primary'}>
            <Loader
                role="status"
                aria-label="Loading"
                style={style}
                className={cn('animate-spin ', className)}
            />
            <span className={'text-sm text-base mt-1'}>{text}</span>
        </div>
    );
};

export default Spinner;