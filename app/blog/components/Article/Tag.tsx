"use client"

import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import {MouseEventHandler, useCallback} from "react";

type TagProps = {
    name: string
    href?: string
    icon?: string
    isClick?: boolean
} & BaseComponentProps


export function Tag(props: TagProps) {
    const {name, href, icon = '/images/tag.png', isClick = true, className, style} = props
    const router = useRouter();

    const handleClick: MouseEventHandler<HTMLDivElement> = useCallback((e) => {
        if (!isClick) return
        e.stopPropagation(); // 阻止冒泡，这样点击按钮就不会触发 Link 的跳转
        e.preventDefault();  // 阻止默认行为
        router.push(href ? href : `/blog/article/list?tags=${name}`)
    }, [href, isClick])

    return (
        <div
            className={cn('rounded-sm bg-sky-50  inline-flex items-center px-1 py-[1px] text-sm text-gray-500 dark:bg-transparent', className)}
            style={style}
            onClick={handleClick}
        >
            <img src={icon} className={'size-4 mr-1'} alt={'标签'}/>
            <span>{name}</span>
        </div>
    )
}

export function CategoryTag({cid, ...props}: Omit<TagProps, 'icon'> & { cid: number }) {

    return <Tag {...props} icon={'/images/xiangrikui.png'} href={`/blog/article/list?cid=${cid}`}/>
}
