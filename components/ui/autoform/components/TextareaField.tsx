import React from "react";
import {Textarea} from "@/components/ui/textarea"
import {AutoFormFieldProps} from "@autoform/react";

export const TextareaField: React.FC<AutoFormFieldProps> = ({
                                                                inputProps,
                                                                error,
                                                                id,
                                                            }) => {
    const {key, ...props} = inputProps;

    return (
        <Textarea id={id} className={error ? "border-destructive" : ""} {...props} />
    );
};
