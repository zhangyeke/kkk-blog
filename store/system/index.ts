import {devtools, persist} from 'zustand/middleware'
import {StoreCreator} from "../utils";
import {setDeepValue} from "@/lib/utils";

const myMiddlewares = (f) => devtools(persist(f, {name: 'bearStore'}))

export type Themes = {
    primary: string
}

export interface SystemSliceState {
    themes: Themes
}

export interface SystemSliceAction {
    updateThemes: (value: Themes | string, key?: keyof Themes) => void
    reset: () => void
}

export type SystemSlice = SystemSliceState & SystemSliceAction

export const useSystemSlice: StoreCreator<SystemSlice> = (set, get, store) => ({
    themes: {
        primary: "#e6c99f"
    },
    /*更新主题*/
    updateThemes: (value, key) => {
        set(state => {
            if (key && typeof value === 'string') {
                state.themes = setDeepValue(state.themes, key, value)
            } else {
                state.themes = value as Themes
            }
        })
    },
    /*重置状态*/
    reset: () => {
        set(store.getInitialState())
    }
})


/*const useBearStore = create()(
    myMiddlewares((set) => ({
        bears: 0,
        increase: (by) => set((state) => ({bears: state.bears + by})),
    })),
)*/

/*
* 它不需要钩子来调用作;
* 有助于代码拆分
* */
// export const inc = () =>
//     useBoundStore.setState((state) => ({ count: state.count + 1 }))
//
// export const setText = (text) => useBoundStore.setState({ text })
