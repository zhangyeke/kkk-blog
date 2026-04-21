import {Input} from "@/components/ui/input";
import { useCallback, useContext} from "react";
import {ElfFormContext} from "@/context/elf-form-context"
import {CustomControlProps} from "@/components/k-view/Form/type";

export const CustomInput = ({value, placeholder, onChange}: CustomControlProps) => {
    const {setState, ...state} = useContext(ElfFormContext)

    const handleStateChange = useCallback((newState: Partial<typeof state>) => setState?.({...state, ...newState}), [setState])


    return (
        <Input
            id="email"
            type={"email"}
            placeholder={placeholder}
            value={value}
            autoComplete="off"
            onChange={onChange}
            onFocus={() => handleStateChange({isTyping: true})}
            onBlur={() => handleStateChange({isTyping: false})}
        />

    );
};
