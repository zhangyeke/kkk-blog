"use client"
import React from "react"
import {PostWithUser} from "@/types/post";
import {CalendarRange, Star} from "lucide-react";
import {dateFormat} from "@/lib/date";
import {AsyncMarkedEditor, Image} from "@/components/k-view";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import Link from "next/link";

import {CategoryTag, Tag} from "@/app/blog/components/Article/Tag";

type HorizontalProps = {
    data: PostWithUser
    direction?: 'left' | 'right'
    cateClicked?: boolean
}


export default function Horizontal({data, direction, cateClicked = true}: HorizontalProps) {
    const tags = data.tags.split(',')
    return (
        <Link
            href={`/blog/article/${data.id}`}
            className={'flex shadow-sm rounded-lg  h-70  overflow-hidden bg-card cursor-pointer hover:shadow-lg transition-shadow duration-300'}>

            <div className={`flex-1 flex flex-col p-4 overflow-hidden ${direction === 'left' ? 'order-2' : ''}`}>
                <div className={'flex items-center text-gray-600 text-xs'}>
                    <CalendarRange className={'size-3 mr-1'}/>
                    <span>发布于：{dateFormat(data.createdAt)}</span>
                </div>
                <Tooltip>
                    <TooltipTrigger>
                        <h3 className={'line-clamp-1 text-left text-base font-bold text-lg mt-4 '}>{data.title}</h3>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{data.title}</p>
                    </TooltipContent>
                </Tooltip>
                <div className={'flex items-center text-gray-500 text-sm my-2 min-w-0'}>
                    <img src={'/images/hot.png'} className={'size-5 mr-1'} alt={'热度'}/>
                    <span>{data.pv}</span>
                    <Star className={'size-4 ml-2 mr-1 text-yellow-300 '}/>
                    <span>{data.favoriteCount}</span>
                    <Image
                        src={data.user.avatar || ''}
                        className={'object-cover size-5 ml-2 mr-1 rounded-full'}
                        fallback={data.user.name.substring(0,1)}
                    />
                    <span className={'min-w-0 flex-1 truncate'}>{data.user.name}</span>
                </div>

                <div className={'line-clamp-3 mb-2'}>
                    <AsyncMarkedEditor className={'pre-complex'} value={data?.summary} readOnly={true}/>
                </div>
                <div className={'mt-auto flex flex-wrap gap-2'}>
                    <CategoryTag
                        isClick={cateClicked}
                        cid={data.categoryId}
                        name={data.category.name}
                        className={'bg-yellow-100 hover:bg-yellow-300 transition-all'}
                    />


                    {
                        tags.length > 0 && tags.map((name, i) => (
                            <Tag
                                isClick={cateClicked}
                                key={i}
                                name={name}
                                className={'hover:bg-sky-200 transition-all'}
                            />
                        ))
                    }


                </div>
            </div>
            <div className={`w-1/2 h-full overflow-hidden `}>
                <Image
                    src={data.cover || ''}
                    className='size-full hover:scale-130 duration-500 transition-transform'
                    alt={data.title}
                />
            </div>
        </Link>
    )
}
