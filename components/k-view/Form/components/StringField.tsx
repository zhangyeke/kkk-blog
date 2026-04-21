import React from "react";
import {Input} from "@/components/ui/input";
import {CustomControlProps} from "../type";

export const StringField: React.FC<CustomControlProps> = (props) => {
    return (
        <Input {...props} />
    );
};
