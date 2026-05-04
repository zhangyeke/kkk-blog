import {env} from "env.mjs"

import {setDeepValue} from "@/lib/utils";
import {StoreCreator} from "../utils";

// const myMiddlewares = (f) => devtools(persist(f, {name: 'bearStore'}))

export type Themes = {
    primary: string
}

export interface SystemSliceState {
    themes: Themes
    /*鼠标轨迹动画*/
    trackMouse: boolean
    /** 博客全屏樱花飘落（fixed 叠层），关则不占 DOM / 不占动画 */
    fullScreenSakura: boolean
    /*首页轮播图*/
    homeBanners: string[]
}

export interface SystemSliceAction {
    updateThemes: (value: Themes | string, key?: keyof Themes) => void
    updateTrackMouseStatus: (value: boolean) => void
    updateFullScreenSakura: (value: boolean) => void
    updateHomeBanners: (values: string[]) => void
    reset: () => void
}

export type SystemSlice = SystemSliceState & SystemSliceAction

export const useSystemSlice: StoreCreator<SystemSlice> = (set, get, store) => ({
    themes: {
        primary: "#e6c99f",
    },
    trackMouse: true,
    fullScreenSakura: true,
    homeBanners: [`${env.NEXT_PUBLIC_RANDOM_IMAGE_URL_1}/web?type=file`, env.NEXT_PUBLIC_RANDOM_IMAGE_URL_2],
    updateTrackMouseStatus: (value: boolean) => {
        set(state => {
            state.trackMouse = value
        })
    },
    updateFullScreenSakura: (value: boolean) => {
        set((state) => {
            state.fullScreenSakura = value
        })
    },
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
