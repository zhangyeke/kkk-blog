import React from "react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CustomControlProps } from "../type"

type SelectOption = { label: string; value: string }

/** Controlled select field used by schema-driven forms. */
export const SelectField: React.FC<CustomControlProps> = (props) => {
    const {
        name,
        value,
        onChange,
        onBlur,
        ref,
        disabled,
        placeholder,
        options = [],
        className,
        style,
        id,
        "aria-describedby": describedBy,
        "aria-invalid": invalid,
        "aria-label": ariaLabel,
    } = props

    return (
        <Select
            name={name}
            value={value == null ? "" : String(value)}
            onValueChange={onChange}
            disabled={disabled}
        >
            <SelectTrigger
                ref={ref}
                id={id}
                name={name}
                onBlur={onBlur}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className={cn("h-8", className)}
                style={style}
            >
                <SelectValue placeholder={placeholder ?? "Select an option"} />
            </SelectTrigger>
            <SelectContent>
                {(options as SelectOption[]).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
