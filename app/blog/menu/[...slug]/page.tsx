import Link from "next/link";

export default async function Page({params}: PageParams<{ slug: string[] }>) {
    const p = await params
    console.log("这是参数", p.slug)
    return (
        <div className={'header-padding'}>
            <div>现在的值是：{p.slug}</div>
            <Link href={'/blog/menu/2'}>去另一个分类</Link>
        </div>
    )
}
