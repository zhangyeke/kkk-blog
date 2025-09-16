import {create} from "zustand";
import {createJSONStorage, devtools, persist} from "zustand/middleware";
import {immer} from "zustand/middleware/immer";
import {env} from "@/env.mjs"
import {createSelectors} from "./utils";
import {SystemSlice, useSystemSlice} from "./system"

const blockList: string[] = []
export type AppStore = SystemSlice
export const appStore = createSelectors(create<AppStore>()(
    immer(
        devtools(
            persist(
                (...args) => ({
                    ...useSystemSlice(...args)
                }), {
                    name: env.NEXT_PUBLIC_STORAGE_NAME,//缓存名称
                    storage: createJSONStorage(() => localStorage),
                    skipHydration: false,//是否跳过在初始化时获取缓存
                    partialize: (state) =>
                        Object.fromEntries(
                            Object.entries(state).filter(([key]) => !blockList.includes(key)),
                        ),
                }
            )
        )
    )
))