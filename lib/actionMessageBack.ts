// import {env} from "@/env.mjs";

const SUCCESS_CODE = 200;
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


export function backFailMessage<T>(msg?: string, data?: T): BaseResource<T> {
    return backMessage(FAIL_CODE, msg, data)
}

export function backSuccessMessage<T>(msg?: string, data?: T): BaseResource<T> {
    return backMessage(SUCCESS_CODE, msg, data)
}

export function backAuthFailMessage<T>(msg?: string, data?: T) {
    return backMessage(AUTH_FAIL_CODE, msg, data)
}
