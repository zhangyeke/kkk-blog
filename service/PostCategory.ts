'use server';
import {createClient} from "@/lib/supabase/server"

export async function createPostCategory(data: { title: string, content?: string }) {

}

export async function getAllPostCategory() {
    const client = await createClient()
    const res = await client.from("post_category").select()
    console.log("所有文章", res)
    return res
}

export async function getPostCategoryById(id: string) {

}

export async function updatePostCategory(id: string, data: { title?: string, content?: string }) {

}

export async function deletePostCategory(id: string) {

}