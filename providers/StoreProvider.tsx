'use client'
import {createContext, useRef} from 'react'

import {appStore} from '@/store'

/** Store 实例（可调用的 API），勿用 `ReturnType<typeof appStore>`（会变成 state 类型而非 API） */
export type CounterStoreApi = typeof appStore

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


