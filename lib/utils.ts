import {type ClassValue, clsx} from "clsx"
import qs from "qs"
import {twMerge} from "tailwind-merge"

/*
 * @Author: EDY
 * @Date: 2025/9/8
 * @LastEditors: EDY
 * @Description: 合并类名
 * @Params:
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}



/*
 * @Author: kkk
 * @Date: 2025/7/16
 * @LastEditors: kkk
 * @Description: 转换对象为查询字符串
 * @Params:
 */
export function toQueryStr<P extends object>(params: P) {
    return qs.stringify(params)
}

/*
 * @Author: kkk
 * @Date: 2025/7/16
 * @LastEditors: kkk
 * @Description: 解析url查询参数转为对象
 * @Params:
 */
export function parseUrlQuery(url: string) {
    const urlObject = new URL(url);
    const queryString = urlObject.search.substring(1);
    return qs.parse(queryString)
}

