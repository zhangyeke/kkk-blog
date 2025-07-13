
import Request from "@/lib/request"

const getBaseURL = (version: number = 2) => `https://v${version}.jinrishici.com`;

const http =  new Request({
    baseUrl: getBaseURL(),
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    },
})

export default http;