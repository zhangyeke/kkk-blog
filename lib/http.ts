import { omit } from "lodash"
import qs from "qs"

import { env } from "@/env.mjs"

export interface RequestConfig extends Omit<RequestInit, "method"> {
  baseUrl?: string
  method: RequestMethod
  headers?: Record<string, string> | HeadersInit
  url?: string
}

export type OmitMethodConfig = Omit<RequestConfig, "method">

/** Query-string encoder used by the shared HTTP client. */
export function toQueryStr<P extends object>(params: P): string {
  return qs.stringify(params)
}

/** Fetch wrapper for the legacy JSON API. */
export class Request {
  private readonly config: RequestConfig

  constructor(config: RequestConfig) {
    this.config = config
  }

  async request<ResponseData>(config: RequestConfig): Promise<ResponseData> {
    const { baseUrl = "", url = "", ...requestInit } = { ...this.config, ...config }
    const response = await fetch(`${baseUrl}${url}`, requestInit)
    return (await response.json()) as ResponseData
  }

  get<Response>(url: string, config?: OmitMethodConfig & { params?: object }): Promise<Response> {
    const params = config?.params ? toQueryStr(config.params) : ""
    const query = params ? `?${params}` : ""
    return this.request<Response>({
      url: `${url}${query}`,
      method: "GET",
      ...omit(config, ["params"]),
    })
  }

  post<Response, Data extends object>(url: string, data?: Data, config?: OmitMethodConfig): Promise<Response> {
    return this.request<Response>({
      url,
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
      ...config,
    })
  }
}

const http = new Request({
  baseUrl: env.NEXT_PUBLIC_API_URL + env.NEXT_PUBLIC_REQUEST_URL,
  method: "GET",
})

export default http
