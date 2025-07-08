import Link from "next/link";

export default async function Web() {

    return (
        <div>
            <Link href={"/blog/article/13"}>文章详情页</Link>
        </div>
    )
}
