const SUCCESS_CODE = 200;
const FAIL_CODE = 0;
const AUTH_FAIL_CODE = 401;
const DEFAULT_MESSAGE = "操作失败，请稍后再试"


export function backMessage<T>(code: number, msg?: string, data?: T) {
    return {
        code,
        message: msg || DEFAULT_MESSAGE,
        data,
    }
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
