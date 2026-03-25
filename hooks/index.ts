import {useContext, useEffect, useState} from "react";
import {useStore} from "zustand/index";
import {AppStoreContext} from "@/providers/StoreProvider";
import type {AppStore} from "@/store";


export {useDebounce} from "./use-debounce"
export {useImageUpload} from "./use-image-upload"
export {useAutoFormSubmit, useAutoFormCustomSubmit} from "./useAutoFormSubmit"

export function useClientMounted() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return mounted
}

export const useAppStore = <T, >(
    selector: (store: AppStore) => T,
): T => {
    const appStoreContext = useContext(AppStoreContext)

    if (!appStoreContext) {
        throw new Error(`useAppStore must be used within AppStoreContext`)
    }

    return useStore(appStoreContext, selector)
}