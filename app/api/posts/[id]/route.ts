// app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { getPostById, updatePost, deletePost } from '@/model/Post';

type Context = { params: { id: string } };

// GET /api/posts/some-id - 获取单篇文章
export async function GET(request: Request, { params }: Context) {
    try {
        const post = await getPostById(params.id);
        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        return NextResponse.json(post);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
    }
}

// PUT /api/posts/some-id - 更新单篇文章
export async function PUT(request: Request, { params }: Context) {
    try {
        const data = await request.json();
        const updatedPost = await updatePost(params.id, data);
        return NextResponse.json(updatedPost);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }
}

// DELETE /api/posts/id - 删除单篇文章
export async function DELETE(request: Request, { params }: Context) {
    try {
        await deletePost(params.id);
        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}