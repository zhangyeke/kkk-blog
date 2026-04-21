import {createContext} from "react";

export const defaultState = {
    password: "",
    showPassword: false,
    isTyping: false,
}

export type ElfFormState = typeof defaultState & {
    setState?: (state: ElfFormState) => void
}

export const ElfFormContext = createContext<ElfFormState>(defaultState)
