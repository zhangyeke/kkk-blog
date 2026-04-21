import React from "react";
import {Textarea} from "@/components/ui/textarea"
import {CustomControlProps} from "../type";
export const TextareaField: React.FC<CustomControlProps> = (props) => {
    // id={id} className={error ? "border-destructive" : ""}
    return (
        <Textarea  {...props} />
    );
};
