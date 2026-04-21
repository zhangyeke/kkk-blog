"use client"
import {Icon} from "@/components/k-view";
import {ChevronsRight} from "lucide-react";
import Link from "next/link";

type HeadCategoryProps = {
    name: string
    isMore?: boolean //是否显示更新按钮
    href?: string //更新按钮链接
    icon?: string
}

export default  function HeadCategory({name, icon = 'fenlei', isMore = true, href}: HeadCategoryProps) {

    return (
        <div
            className={'text-gray-500 flex justify-between items-center border-gray-300 border-b border-dotted pb-1 mb-4'}>
            <div className={'flex items-center '}>
                <Icon className={'text-2xl text-primary mr-1'} name={icon}/>
                <span>{name}</span>
            </div>
            {
                isMore && (
                    <Link
                        href={href || '/blog/article/list'}
                        className={'cursor-pointer flex items-center text-gray-500 hover:text-primary  hover:scale-110 duration-300 transition-transform'}>
                        MORE
                        <ChevronsRight className={''}/>
                    </Link>
                )
            }
        </div>
    )
}
