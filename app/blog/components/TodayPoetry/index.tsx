import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {getTodayPoem} from "@/service/poem";

// 博客首页今日诗词展示组件
export default async function TodayPoetry() {

    const {data: poem} = await getTodayPoem()

    return (
        <Card className="w-full mt-4 max-h-[400px] no-scrollbar overflow-y-auto hover:shadow-lg bg-left bg-[url(/images/shici_bg.jpg)] bg-cover">
            <CardHeader className={'items-center border-solid border-b-1 border-border pb-2'}>
                <CardTitle className={'flex items-center'}>
                    <img alt={'今日诗词'} className={'w-5 mr-1'} src={'/images/shici.png'}/>
                    <span>今日诗词</span>
                </CardTitle>

            </CardHeader>
            <CardContent>
                <div className={'text-center font-bold text-lg'}>{poem.origin.title}</div>
                <div className={'text-right text-gray-500 text-sm mb-1'}>--{poem.origin.author}</div>

                {
                    poem.origin.content.map((line,index)=>(
                        <div className={'text-center'} key={index}>{line}</div>
                    ))
                }
            </CardContent>

        </Card>
    )
}
