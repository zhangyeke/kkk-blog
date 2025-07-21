// app/api/posts/route.ts
import {withResponseHandler} from "@/lib/withResponseHandler";
import {login} from '@/service/Auth';

export const POST = withResponseHandler(async (request)=>{
    const data = await request.json()
    return  await login(data);
})