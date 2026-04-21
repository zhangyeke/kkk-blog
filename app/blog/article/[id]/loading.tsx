import {Hamster} from "@/components/k-view"

export default function Loading() {

    return (
        <div className={'flex-1 flex-center  flex-col'}>
            <Hamster/>
            <span className={'mt-2'}>正在努力加载中...</span>
        </div>
    )
}
