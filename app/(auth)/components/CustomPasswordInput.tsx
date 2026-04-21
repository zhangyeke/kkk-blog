import {Input} from "@/components/ui/input";
import {Eye, EyeOff} from "lucide-react";
import {ChangeEvent, useCallback, useContext, useState} from "react";
import {ElfFormContext} from "@/context/elf-form-context"
import {CustomControlProps} from "@/components/k-view/Form/type";

export const CustomPasswordInput = ({value, placeholder, onChange}: CustomControlProps) => {
    const {setState, ...state} = useContext(ElfFormContext)
    const [showPassword, setShowPassword] = useState(false)

    const handleStateChange = useCallback((newState: Partial<typeof state>) => setState?.({...state, ...newState}), [state, setState])

    const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onChange(e)
        handleStateChange({password: e.target.value})
    }, [])

    const handleShowPasswordChange = useCallback((show: boolean) => {
        setShowPassword(show)
        handleStateChange({showPassword: show})
    }, [handleStateChange])

    return (
        <div className="relative">
            <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={handlePasswordChange}
                className="pr-10"
            />
            <button
                type="button"
                onClick={() => handleShowPasswordChange(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
                {showPassword ? (
                    <EyeOff className="size-5"/>
                ) : (
                    <Eye className="size-5"/>
                )}
            </button>
        </div>
    );
};