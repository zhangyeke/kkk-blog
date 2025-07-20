// app/api/posts/route.ts
import {NextResponse} from 'next/server';
import {withResponseHandler} from "@/lib/withResponseHandler";
import {createPost, getAllPosts} from '@/service/Post';

// GET /api/posts - 获取所有文章
export const GET = withResponseHandler(getAllPosts)

// POST /api/posts - 创建新文章

export const POST = withResponseHandler(async (request)=>{
    const data = await request.json() as any;
    return  await createPost(data);
})