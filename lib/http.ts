import Request from "./request";

 const http = new Request({
    baseUrl: "https://admin.zhengtuqicheng.top",
    method: "GET",
    headers: {
        server: 1,
        version: '1.0.0'
    }
})



export default http