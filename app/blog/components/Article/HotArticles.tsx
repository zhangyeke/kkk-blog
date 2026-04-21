import {CalendarRange, Flame} from "lucide-react";
import {cn} from "@/lib/utils";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {getPostsByPage} from "@/service/post";
import {dateFormat} from "@/lib/date";
import {Image} from "@/components/k-view"
import Link from "next/link";

// interface HotArticlesProps extends BaseComponentProps {
//
//
// }

export default async function HotArticles({className, style}: BaseComponentProps) {
    const posts = await getPostsByPage({
        page: 1,
        pageSize: 3,
        orderBy: {
            pv: 'desc'
        },

    });
    return (
        <Card
            style={style}
            className={cn('pb-0 no-scrollbar overflow-y-auto hover:shadow-lg transition-shadow duration-300', className)}
        >
            <CardHeader className={'items-center border-solid border-b-1 border-border pb-2 dark:border-gray-200'}>
                <CardTitle className={'flex items-center'}>
                    <Flame className={'size-5 mr-1'}/>热门文章
                </CardTitle>

            </CardHeader>
            <CardContent className={'dark:text-gray-900'}>
                {
                    posts.data.list.length && (
                        posts.data.list.map(item => (
                            <Link href={`/blog/article/${item.id}`} key={item.id} className={'mb-4 cursor-pointer block'}>
                                <div className={'flex'}>
                                    <Image
                                        alt={item.title}
                                        src={item.cover}
                                        className={'w-2/5 h-20 rounded-md'}
                                    />
                                    <div className={'flex-1 ml-2 flex flex-col'}>
                                        <p className={'text-base font-bold dark:text-white'}>{item.title}</p>
                                    </div>
                                </div>
                                <div className={'flex items-center text-gray-500 text-xs mt-1'}>
                                    <CalendarRange className={'size-3 mr-1'}/>
                                    <span>{dateFormat(item.createdAt)}</span>
                                </div>
                            </Link>
                        ))
                    )
                }
            </CardContent>

        </Card>
    )
}
