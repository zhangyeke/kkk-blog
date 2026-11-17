import { toast } from "sonner"

import { backFailMessage, SUCCESS_CODE } from "@/lib/actionMessageBack"

/** Handle a server-action response and show the default toast messages. */
export function responseAsyncHandle<T>(
  promiseResponse: Promise<BaseResource<T>>,
  success?: (response: BaseResource<T>) => void,
  fail?: (response: BaseResource<T>) => void,
): Promise<BaseResource<T>> {
  return promiseResponse.then((response) => {
    if (response.code === SUCCESS_CODE) {
      if (success) success(response)
      else toast.success(response.message)
      return response
    }

    if (fail) fail(response)
    else toast.error(response.message)
    return Promise.reject(response)
  }).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error) return Promise.reject(error)
    return Promise.reject(backFailMessage("未知错误", null))
  })
}
