import React from "react";
import {ArticleList} from "@/app/blog/components/Article";
import {Suspense} from "@/components/Loader";
import http from "@/lib/http";


function getList() {
    return http.get('/shopapi/article/lists')
}

function getGoodsList(){
    return http.get('/shopapi/goods/lists?page_no=1&page_size=10&category_id=10')
}

export const preload = () => {
    // void evaluates the given expression and returns undefined
    // https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/void
    void getList()
}

export async function Item() {
    const result = await getList()

    console.log(result, "djsakljdasl")

    return (
        <div>
            {JSON.stringify(result)}
        </div>
    )
    // ...
}

export default async function Web() {

    const res = await getGoodsList()
    console.log(res,"商品列表")
    if(!res.data.lists.length) return null
    return (
        <div className="text-primary">
            <Suspense>
                <Item></Item>
                <div>123</div>
                {/*<ArticleList api={http.get('/shopapi/article/lists')}/>*/}
            </Suspense>
        </div>
    )
}
