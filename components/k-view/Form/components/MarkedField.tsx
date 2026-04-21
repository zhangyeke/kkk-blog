import React from "react";
import {AsyncMarkedEditor} from "@/components/k-view/MarkedEditor"
import {CustomControlProps} from "../type";


export const MarkedField = ({onChange, name, ...props}: CustomControlProps) => {

    return (
        <AsyncMarkedEditor
            {...props}
            onChange={(v) => {
                onChange({
                    target: {
                        name,
                        value: v
                    }
                })
            }}
        />
    )
};
