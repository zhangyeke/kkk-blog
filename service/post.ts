'use server';
// --- CREATE (新增) ---
export async function createPost(data: { title: string, content?: string }) {

}

// --- READ (查询) ---
// 获取所有文章
export async function getAllPosts() {

}

// 根据 ID 获取单篇文章
export async function getPostById(id: string) {

}

// --- UPDATE (更新) ---
export async function updatePost(id: string, data: { title?: string, content?: string }) {

}

// --- DELETE (删除) ---
export async function deletePost(id: string) {

}