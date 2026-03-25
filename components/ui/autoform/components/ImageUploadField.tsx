import React from "react";
import {AutoFormFieldProps} from "@autoform/react";
import {ImageUpload} from "@/components/ui/image-upload";

export const ImageUploadField: React.FC<AutoFormFieldProps> = ({
                                                                   inputProps,
                                                                   error,
                                                                   value,
                                                               }) => {
    const {name, onChange} = inputProps
    return (
        <ImageUpload
            defaultValue={value}
            className={error ? "border-destructive" : ""}
            onUpload={(v) => onChange({
                target: {
                    name,
                    value: v
                }
            })}
        />
    );
};
