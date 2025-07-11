import {Metadata} from "next"
import Link from "next/link";
import MyMdx from "@/components/MyMdx.mdx";

export const metadata: Metadata = {

}

export default async function Web() {


    return (
        <div className="text-primary">
            <MyMdx content={"这是内容参数"}>
                <h3>这是标题3</h3>
            </MyMdx>
            <Link href={"/blog/test/12/21312"}>跳转到ddd详情</Link>
            <div>
                <Link href={"/blog/article/12"}>跳转到文章详情</Link>
            </div>
            <div>
                <Link href={"/blog/article"} prefetch={false}>文章列表</Link>
            </div>
            <div>
                <Link href={"/blog/login"}>去登录</Link>
            </div>
            <div>
                <Link href={"/blog/test"} prefetch={false}>
                    去测试页

                </Link>
            </div>
        </div>
    )
}
