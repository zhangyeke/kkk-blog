import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {getTodayPoem} from "@/service/poem";
import {TextLine} from "@/components/k-view";
import {cn} from "@/lib/utils";


export default async function TodayPoetry({className, style}: BaseComponentProps) {

    const {data: poem} = await getTodayPoem()


    return (
        <Card
            style={style}
            className={cn("w-full  max-h-[400px] no-scrollbar overflow-y-auto hover:shadow-lg bg-left bg-[url(/images/shici_bg.jpg)] bg-cover transition-shadow duration-300", className)}
        >
            <CardHeader className={'items-center border-solid border-b-1 border-border pb-2 dark:border-gray-200'}>
                <CardTitle className={'flex items-center'}>
                    <img alt={'今日诗词'} className={'w-5 mr-1'} src={'/images/shici.png'}/>
                    <span>今日诗词</span>
                </CardTitle>

            </CardHeader>
            <CardContent className={'dark:text-gray-900'}>
                <div className={'text-center font-bold text-lg'}>{poem.origin.title}</div>
                <div className={'text-right text-gray-500 text-sm mb-1'}>--{poem.origin.author}</div>

                {
                    poem.origin.content.map((line, index) => (
                        <p key={index}>
                            <TextLine duration={500} className={'text-center'}>{line}</TextLine>
                        </p>
                    ))
                }
            </CardContent>

        </Card>
    )
}
