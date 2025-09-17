import {ArrowRight} from "lucide-react";
import React from "react";
import Link from "next/link"


export type GoButtonProps = {
    title?: string
    href?: React.ComponentProps<Link>['href']
} & BaseComponentProps

export function GoButton(props: GoButtonProps) {
    const {title = '写文章', className, href = '/', style} = props;

    return (
        <Link
            href={href}
            style={style}
            className={`${className} group relative cursor-pointer p-2 w-full border border-gray-200 bg-white rounded-full overflow-hidden text-black text-center font-semibold`}
        >
            <span
                className='translate-x-1 group-hover:translate-x-12 group-hover:opacity-0 transition-all duration-300 inline-block'>
                {title}
            </span>
            <div
                className='flex gap-2 text-white z-10 items-center absolute top-0 h-full w-full justify-center translate-x-12 opacity-0 group-hover:-translate-x-1 group-hover:opacity-100 transition-all duration-300'>
                <span>{title}</span> <ArrowRight/></div>
            <div
                className='absolute top-[40%] left-[36%] h-2 w-2 group-hover:h-full group-hover:w-full rounded-lg bg-primary/50 scale-[1]  group-hover:bg-bg-primary group-hover:scale-[1.8] transition-all duration-300 group-hover:top-[0%] group-hover:left-[0%] '></div>
        </Link>
    );
}
