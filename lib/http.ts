import {env} from "@/env.mjs"
import Request from "./Request";

// https://admin.zhengtuqicheng.top
const http = new Request({
    baseUrl: env.API_URL + env.REQUEST_URL,
    method: "GET",
    // headers: {
    //     server: 1,
    //     version: '1.0.0'
    // }
})


export default http