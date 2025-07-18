// app/api/posts/route.ts
import {NextResponse} from 'next/server';
import {createPost, getAllPosts} from '@/model/Post';

// GET /api/posts - 获取所有文章
export async function GET() {
    try {
        const posts = await getAllPosts();
        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({error: 'Failed to fetch posts',status: 500});
    }
}

// POST /api/posts - 创建新文章
export async function POST(request: Request) {
    try {
        const data = await request.json();
        const newPost = await createPost(data);
        return NextResponse.json({data: newPost, status: 200});
    } catch (error: any) {
        return NextResponse.json({error: error.message, status: 400});
    }
}