/* eslint-disable @typescript-eslint/no-explicit-any */
import {ControllerRenderProps} from "react-hook-form";

export interface CustomControlProps extends ControllerRenderProps {
    label?: string | number | boolean | null;
    api?: (p?: {
        [key: string]: string | number
    }) => Promise<BaseResource<any>>

    [key: string]: any;
}
