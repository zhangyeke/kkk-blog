// app/api/posts/route.ts
import {withResponseHandler} from "@/lib/withResponseHandler";
import {register} from '@/service/Auth';

export const POST = withResponseHandler(async (request)=>{
    const data = await request.json()
    console.log("注册参数",data)
    return  await register(data);
})