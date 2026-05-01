declare module "sakura-js/dist/sakura.js" {
  export interface SakuraColorScheme {
    gradientColorStart: string
    gradientColorEnd: string
    gradientColorDegree: number
  }

  export interface SakuraCtorOptions {
    className?: string
    fallSpeed?: number
    maxSize?: number
    minSize?: number
    delay?: number
    colors?: SakuraColorScheme[]
  }

  export default class Sakura {
    constructor(selector: string, options?: SakuraCtorOptions)

    start(): void

    stop(graceful?: boolean): void
  }
}
