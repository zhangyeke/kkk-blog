"use client"
import Link from "next/link";
import {CalendarRange, Star} from "lucide-react";
import {ReactNode} from "react";
import {PostWithFavorites, PostWithUser} from "@/types/post";
import {dateFormat} from "@/lib/date";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Image, LikeIcon} from "@/components/k-view"
import {CategoryTag, Tag} from "./Tag"

type VerticalProps = {
    data: PostWithFavorites | PostWithUser
    renderCategory?: ReactNode
    showCollect?: boolean
    onCollectChange?: () => void
}


export default function Vertical({data, renderCategory, showCollect, onCollectChange}: VerticalProps) {
    const tags = data.tags.split(',')
    return (
        <Link
            href={`/blog/article/${data.id}`}
            className={'flex flex-col h-[350px] pb-1 shadow-sm rounded-sm overflow-hidden bg-card cursor-pointer hover:shadow-lg transition-shadow duration-300'}>
            <Image
                src={data.cover}
                alt={data.title}
                className='w-full mb-2 h-50 object-cover'
            />

            <div className={'p-1.5 flex flex-col flex-1'}>

                <div className={'flex items-center text-gray-600 text-sm'}>
                    <CalendarRange className={'size-4 mr-1'}/>
                    <span>发布于：{dateFormat(data.createdAt)}</span>
                    {
                        showCollect && (
                            <LikeIcon
                                icon={Star}
                                activeClassName={'text-yellow-300 fill-yellow-300'}
                                particlesClassName={'bg-yellow-300'}
                                checked={Boolean((data as PostWithFavorites)?.favorites?.length)}
                                className={'ml-auto'}
                                onChange={onCollectChange}
                            />
                        )
                    }

                </div>
                <Tooltip>
                    <TooltipTrigger>
                        <h3 className={'line-clamp-1 text-left text-base font-bold text-lg mt-2 '}>{data.title}</h3>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{data.title}</p>
                    </TooltipContent>
                </Tooltip>

                <div className={'flex items-center text-gray-500 text-sm mt-1'}>
                    <img src={'/images/hot.png'} className={'size-5 mr-1'} alt={'热度'}/>
                    <span>{data.pv} 热度</span>
                    <Image
                        src={data.user.avatar || ''}
                        className={'object-cover size-5 ml-2 mr-1 rounded-full'}
                        fallback={data.user.name.substring(0, 1)}

                    />
                    <span>{data.user.name}</span>
                </div>

                <div className={'mt-auto flex flex-wrap gap-2'}>
                    {
                        renderCategory ? renderCategory : (
                            <CategoryTag
                                cid={data.categoryId}
                                name={data.category.name}
                                className={'bg-yellow-100 hover:bg-yellow-300 transition-all'}
                            />
                        )
                    }


                    {
                        tags.length > 0 && tags.map((name, i) => (
                            <Tag
                                key={i}
                                name={name}
                                className={'hover:bg-sky-200 transition-all'}
                            />
                        ))
                    }


                </div>
            </div>

        </Link>
    )
}
