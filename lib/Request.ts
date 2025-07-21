import {omit} from "lodash"
import {toQueryStr} from "@/lib/utils";

export interface RequestConfig extends Omit<RequestInit, "method"> {
    baseUrl?: string
    // timeout: number
    method: RequestMethod
    headers?: any
    url?: string
}

export type OmitMethodConfig = Omit<RequestConfig, "method">


// & Record<string, any>
class Request {
    config: RequestConfig = {
        baseUrl: "",
        // timeout:3000,
        method: "GET",
        headers: {}
    }

    constructor(config: RequestConfig) {
        this.config = config
    }

    request<ResponseData>(config: RequestConfig) {
        const {baseUrl, url, ...otherConfig} = {
            ...this.config,
            ...config
        }

        return new Promise<ResponseData>(async (resolve, reject) => {
            try {
                const res = await fetch(`${baseUrl}${url}`, {
                    ...otherConfig
                })
                const data = await res.json() as ResponseData
                resolve(data)
            } catch (err) {
                reject(err)
            }

        })

    }

    get<Response>(url: string, config?: OmitMethodConfig & { params?: object }) {
        let params = ''
        if (config?.params) {
            params = toQueryStr(config.params)
        }
        return new Promise<Response>(async (resolve, reject) => {
            try {
                const res = await this.request<Response>({
                    url: `${url}?${params}`,
                    method: "GET",
                    ...omit(config, ["params"])
                })
                resolve(res)
            } catch (err) {
                reject(err)
            }

        })
    }

    post<D = Record<string, any>>(url: string, data?: D, config?: OmitMethodConfig) {
        return new Promise<Response>(async (resolve, reject) => {
            try {
                const res = await this.request<Response>({
                    url,
                    method: "POST",
                    body: JSON.stringify(data),
                    ...config
                })
                resolve(res)
            } catch (err) {
                reject(err)
            }

        })
    }
}

export default Request
