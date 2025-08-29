export default async function Page({params, searchParams}: PageParams<any, { c_id: string }>) {
    const s = await searchParams

    console.log(s.c_id, "搜索页面")
    return (
        <div>
            文章搜索
        </div>
    )
}
