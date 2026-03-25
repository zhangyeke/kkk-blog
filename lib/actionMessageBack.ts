import {env} from "@/env.mjs";

const SUCCESS_CODE = 200;
const FAIL_CODE = 0;
const AUTH_FAIL_CODE = 401;
const DEFAULT_MESSAGE = "操作失败，请稍后再试"
const IMAGE_PAYLOAD_LARGE_CODE = 413 // 图片负载过大


export function backMessage<T>(code: number, msg?: string, data?: T) {
    return {
        code,
        message: msg || DEFAULT_MESSAGE,
        data,
    }
}

export function backImagePayloadLargeMessage<T>(msg?: string, data?: T) {
    return backMessage(IMAGE_PAYLOAD_LARGE_CODE, `图片大小超过限制，最大可上传 ${env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}`, null)
}


export function backFailMessage<T>(msg?: string, data?: T) {
    return backMessage(FAIL_CODE, msg, data)
}

export function backSuccessMessage<T>(msg?: string, data?: T) {
    return backMessage(SUCCESS_CODE, msg, data)
}

export function backAuthFailMessage<T>(msg?: string, data?: T) {
    return backMessage(AUTH_FAIL_CODE, msg, data)
}
