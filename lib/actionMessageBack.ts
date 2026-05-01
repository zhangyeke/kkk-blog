/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-09-17 21:38:09
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 01:13:48
 * @FilePath: \blog\lib\actionMessageBack.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// import {env} from "@/env.mjs";

export const SUCCESS_CODE = 200;
const FAIL_CODE = 0;
export const AUTH_FAIL_CODE = 401;
const DEFAULT_MESSAGE = "操作失败，请稍后再试"
const IMAGE_PAYLOAD_LARGE_CODE = 413 // 图片负载过大


export class ActionError extends Error {
    code: number;

    constructor(message: string, code) {
        super(message);
        this.code = code;
        this.name = "ActionError";
    }
}


export function backMessage<T>(code: number, msg?: string, data?: T): BaseResource<T> {
    return {
        code,
        message: msg || DEFAULT_MESSAGE,
        data: data as T, // 强制类型收窄
    }
}

export function backImagePayloadLargeMessage<T>(msg: string, data?: T) {
    return backMessage(IMAGE_PAYLOAD_LARGE_CODE, msg, data)
}


export function backFailMessage<T = null>(msg?: string, data?: T): BaseResource<T> {
    return backMessage(FAIL_CODE, msg, data)
}

export function backSuccessMessage<T>(msg?: string, data?: T): BaseResource<T> {
    return backMessage(SUCCESS_CODE, msg, data)
}

export function backAuthFailMessage<T>(msg?: string, data?: T) {
    return backMessage(AUTH_FAIL_CODE, msg, data)
}
