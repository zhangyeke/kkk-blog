
function getData(){
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve('数据加载完成');
        },2000);
    })
}

export default async function Page({params}:PageParams) {
    await getData();

    return (
        <div>
            文章详情页
        </div>
    )
}
