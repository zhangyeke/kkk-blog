import {Input} from "@/components/ui/input";
import React from "react";
import {CustomControlProps} from "../type";

export const NumberField: React.FC<CustomControlProps> = (props) => {

    return (
        <Input
            type="number"
            {...props}
        />
    );
};
