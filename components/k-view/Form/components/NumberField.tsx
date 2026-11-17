import {Input} from "@/components/ui/input";
import React from "react";
import {CustomControlProps} from "../type";

export const NumberField: React.FC<CustomControlProps> = (props) => {
    const {value, onChange, ...inputProps} = props

    return (
        <Input
            type="number"
            {...inputProps}
            value={value ?? ""}
            onChange={(event) => {
                const nextValue = event.target.value
                onChange(nextValue === "" ? undefined : Number(nextValue))
            }}
        />
    );
};
