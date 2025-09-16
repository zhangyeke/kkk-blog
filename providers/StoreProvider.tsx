'use client'
import {createContext, useRef} from 'react'

import { appStore} from '@/store'

export type CounterStoreApi = ReturnType<typeof appStore>

export const AppStoreContext = createContext<CounterStoreApi | undefined>(
    undefined,
)


export const AppStoreProvider = ({
                                     children,
                                 }: ContainerProps) => {
    const storeRef = useRef<CounterStoreApi | null>(null)
    if (storeRef.current === null) {
        storeRef.current = appStore
    }
    return (
        <AppStoreContext.Provider value={storeRef.current}>
            {children}
        </AppStoreContext.Provider>
    )
}


