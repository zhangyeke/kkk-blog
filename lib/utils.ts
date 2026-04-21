import {type ClassValue, clsx} from "clsx"
import qs from "qs"
import {remark} from 'remark'
import strip from 'strip-markdown'
import {toast} from "sonner";
import {twMerge} from "tailwind-merge"
import {get, set} from "lodash"
import {uploadImage} from "@/service/fileUpload";
import {env} from "@/env.mjs";
import {backImagePayloadLargeMessage} from "@/lib/actionMessageBack";
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

export function uploadImagePromise(image: File, isToast = true) {
    return new Promise<string>(async (resolve, reject) => {
            const MAX_SIZE = parseInt(env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT) * 1024 * 1024; // 将MB转换为字节
            if (image.size > MAX_SIZE) {
                const str = `图片大小超过限制，最大可上传 ${env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}`;
                if (isToast) toast.error(str)
                reject(backImagePayloadLargeMessage(str))
                return
            }
            try {
                const formData = new FormData()
                formData.append('file', image)
                const params = {
                    dedup: true,
                    album_id: 1516,
                }
                formData.append('params', JSON.stringify(params))
                const res = await uploadImage(formData)
                resolve(res ? res?.url : '')
            } catch (err) {
                reject(err)
            }
        }
    )
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

/*获取纯文本的markdown内容*/

export async function getPlainText(content: string, length: number = 150) {
    const file = await remark()
        .use(strip) // 核心插件：去除所有 Markdown 格式
        .process(content)

    return String(file).trim().slice(0, length) + (content.length > length ? '...' : '')
}
