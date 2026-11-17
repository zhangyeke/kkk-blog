import {env} from "env.mjs"

import {setDeepValue} from "@/lib/object";
import {StoreCreator} from "../utils";
import { clampFallingSpeed, type FallingDirection, type FallingPattern, fallingSpeed } from "@/lib/falling-patterns"

// const myMiddlewares = (f) => devtools(persist(f, {name: 'bearStore'}))

export type Themes = {
    primary: string
}

export interface SystemSliceState {
    themes: Themes
    /*鼠标轨迹动画*/
    trackMouse: boolean
    fallingEnabled: boolean
    fallingPattern: FallingPattern
    fallingImage: string
    fallingSizes: [number, number]
    fallingDensity: number
    fallingSpeed: number
    fallingDirection: FallingDirection
    /*首页轮播图*/
    homeBanners: string[]
}

export interface SystemSliceAction {
    updateThemes: (value: Themes | string, key?: keyof Themes) => void
    updateTrackMouseStatus: (value: boolean) => void
    setFallingPattern: (value: FallingPattern) => void
    setFallingImage: (value: string) => void
    setFallingSizes: (value: [number, number]) => void
    setFallingDensity: (value: number) => void
    setFallingSpeed: (value: number) => void
    setFallingDirection: (value: FallingDirection) => void
    updateHomeBanners: (values: string[]) => void
    reset: () => void
}

export type SystemSlice = SystemSliceState & SystemSliceAction

export const useSystemSlice: StoreCreator<SystemSlice> = (set, get, store) => ({
    themes: {
        primary: "#e6c99f",
    },
    trackMouse: true,
    fallingEnabled: true,
    fallingPattern: "petal",
    fallingImage: "",
    fallingSizes: [14, 28],
    fallingDensity: 4,
    fallingSpeed: fallingSpeed.default,
    fallingDirection: "down",
    homeBanners: [`${env.NEXT_PUBLIC_RANDOM_IMAGE_URL_1}/web?type=file`, env.NEXT_PUBLIC_RANDOM_IMAGE_URL_2],
    updateTrackMouseStatus: (value: boolean) => {
        set(state => {
            state.trackMouse = value
        })
    },
    setFallingPattern: (fallingPattern) => set({ fallingPattern, fallingEnabled: fallingPattern !== "none" }),
    setFallingImage: (fallingImage) => set({ fallingImage }),
    setFallingSizes: (fallingSizes) => set({ fallingSizes }),
    setFallingDensity: (fallingDensity) => set({ fallingDensity }),
    setFallingSpeed: (value) => set({ fallingSpeed: clampFallingSpeed(value) }),
    setFallingDirection: (fallingDirection) => set({ fallingDirection }),
    updateHomeBanners: (newBanners) => {
        set(state => {
            state.homeBanners = newBanners
        })
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
