import React from "react";
import {ImageUpload} from "@/components/ui/image-upload";
import {CustomControlProps} from "../type"

export const ImageUploadField: React.FC<CustomControlProps> = ({
                                                                   name, onChange, value
                                                               }) => {

    // const {name, onChange} = inputProps
    // className={error ? "border-destructive" : ""}
    return (
        <ImageUpload
            value={value}
            onUpload={(v) => onChange({
                target: {
                    name,
                    value: v
                }
            })}
        />
    );
};
