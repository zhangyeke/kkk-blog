// export default function () {
//     const res = await fetch('https://admin.zhengtuqicheng.top/shopapi/article/lists', {
//
//         headers: {
//
//             // server:1,
//             // version:'1.0.0'
//         }
//     })
// }

type RequestConfig = {
    baseUrl?: string
    // timeout: number
    method: RequestMethod
    headers?: any
    url?: string
}

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

    request(config: RequestConfig) {
        const {baseUrl, url, ...otherConfig} = {
            ...this.config,
            ...config
        }

        return new Promise(async (resolve, reject) => {
            try {
                const res = await fetch(`${baseUrl}${url}`, {
                    ...otherConfig
                })
                resolve(await res.json())
            } catch (err) {
                reject(err)
            }

        })

    }

    get(url: string, config?:RequestConfig) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await this.request({
                    url,
                    method: "GET",
                    ...config
                })
                resolve(res)
            } catch (err) {
                reject(err)
            }

        })
    }

    post() {

    }
}

export default Request
