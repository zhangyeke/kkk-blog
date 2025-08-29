'use server'

export interface FormParams {
    email: string;
    password: string
}

// 登录
export async function login({email, password}: FormParams) {

}

// 注册
export async function register({email, password}: FormParams) {

}


// 退出登录
export async function logout() {

}