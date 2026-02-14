import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {getTodayPoem} from "@/service/poem";

export default async function TodayPoetry() {

    const {data: poem} = await getTodayPoem()

    console.log(poem, "今日诗词")

    return (
        <Card className="w-full mt-4 hover:shadow-lg">
            <CardHeader className={'items-center'}>
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
