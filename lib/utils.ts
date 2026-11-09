import {type ClassValue, clsx} from "clsx"
import qs from "qs"

import {toast} from "sonner";
import {twMerge} from "tailwind-merge"
import {get, set} from "lodash"
import {uploadImage} from "@/service/fileUpload";
import {env} from "@/env.mjs";
import {backFailMessage, SUCCESS_CODE} from "./actionMessageBack";
import {imageUploadLimitBytes} from "./image-upload-policy";
import {DEFAULT_UPLOAD_ROUTE, type UploadRouteId} from "./image-upload-routes";
import {isNumber} from "./validator";

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
 * @Author: EDY
 * @Date: 2025/9/15
 * @LastEditors: EDY
 * @Description: 获取深层对象属性
 * @Params:
 */

export function getDeepValue<T, S>(obj: T, path: string, defaultValue?: S) {
    return get(obj, path, defaultValue);
}

/*
 * @Author: EDY
 * @Date: 2025/9/15
 * @LastEditors: EDY
 * @Description: 设置深层对象属性
 * @Params:
 */

export function setDeepValue<T extends object, V>(obj: T, path: string, value: V) {
    return set(obj, path, value)
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

/*
 * @Author: kkk
 * @Date: 2026/3/23
 * @LastEditors: kkk
 * @Description: 延迟执行
 * @Params:
 */
export function sleep(delay = 5000) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('')
        }, delay)
    })
}

/*
 * @Author: kkk
 * @Date: 2026/3/23
 * @LastEditors: kkk
 * @Description: 上传图片
 * @Params:
 */

export async function uploadImagePromise(
    image: File,
    isToast = true,
    route: UploadRouteId = DEFAULT_UPLOAD_ROUTE,
): Promise<string> {
    try {
        if (image.size > imageUploadLimitBytes(env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT)) {
            throw new Error(`图片大小超过限制，最大可上传 ${env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}`)
        }
        const formData = new FormData()
        formData.append('file', image)
        formData.append('route', route)
        const response = await uploadImage(formData)
        if (response.code !== SUCCESS_CODE || !response.data?.url) {
            throw new Error(response.message || '图片上传失败')
        }
        return response.data.url
    } catch (error) {
        if (isToast) toast.error(error instanceof Error ? error.message : '图片上传失败')
        throw error
    }
}

/*
 * @Author: kkk
 * @Date: 2026/3/24
 * @LastEditors: kkk
 * @Description: 判断字符串是否为数字
 * @Params:
 */
export const isStringNumber = <V>(value: V): boolean => {
    return (
        typeof value === 'string' &&    // 必须是字符串类型
        value.trim() !== '' &&          // 排除空字符串或仅包含空格的字符串
        !isNaN(Number(value))           // 转换后必须是一个有效数字
    );
};

/*
 * @Author: kkk
 * @Date: 2026/3/24
 * @LastEditors: kkk
 * @Description: 将字符串转换为数字，如果不是数字则返回原值
 * @Params:
 */
export function str2num<V>(v: V) {
    return isStringNumber(v) ? Number(v) : v
}

// 添加单位
export const addUnit = (num: number | string, unit = "px") => {
    if (typeof num === 'string') return num;
    return isNumber(num) ? `${num}${unit}` : '';
}

/**
 * 统一异步包装执行器
 * 无论传入的是同步还是异步函数，都安全地以异步方式处理结果
 */
export async function executeAsyncSafe(fn, ...args) {
    try {
        const result = fn(...args);
        // 自动处理：如果是 Promise 则 await，如果是普通值则直接返回
        return await result;
    } catch (error) {
        throw error;
    }
}

/*
 * @Author: kkk
 * @Date: 2026/4/22
 * @LastEditors: kkk
 * @Description: 处理server action 返回的数据
 * @Params:
 */
export function responseAsyncHandle<T>(promiseResponse: Promise<BaseResource<T>>, success?: (res: BaseResource<T>) => void, fail?: (res: BaseResource<T>) => void): Promise<BaseResource<T>> {
    return new Promise((resolve, reject) => {
        promiseResponse.then(res => {
            if (res.code === SUCCESS_CODE) {
                if (success) {
                    success(res)
                } else {
                    toast.success(res.message)
                }
                resolve(res)
            } else {
                if (fail) {
                    fail(res)
                } else {
                    toast.error(res.message)
                }
                reject(res)
            }
        }).catch(() => {
            reject(backFailMessage('未知错误', null))
        })
    })
}
/**
 * 辅助函数：将大驼峰（PascalCase, 如 ArrowRight）转换为短横线格式（kebab-case, 如 arrow-right）
 */
export const toKebabCase = (str: string): string => {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
