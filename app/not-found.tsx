"use client"
import "@/styles/not-found.css"
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="content">
            <div className="page-404">
                <h1 className={'text-gray-900'}>404</h1>
                <p className="info text-gray-500">
                    您已到达宇宙的边缘。您所请求的页面无法找到。别担心，您可以返回上一页。
                </p>
                <Button
                    className={'rounded-full mr-4 '}
                    variant={'secondary'}
                    size={'lg'}
                    onClick={router.back}
                >返回上一页</Button>
                <Button
                    className={'rounded-full'}
                    size={'lg'}
                    onClick={() => router.push('/blog')}
                >首页</Button>
            </div>
            <div className="astronaut">
                <img src="/images/not-found/astronaut.png" className="astronaut-img" alt="宇航员"/>
            </div>
        </div>
    )
}
