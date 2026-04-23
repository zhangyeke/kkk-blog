
import EditUserForm from "./components/EditUserForm"
import {getMeInfo} from "@/service/user";
import {notFound} from "next/navigation";

export default async function MePage() {
    const user = await getMeInfo()

    if (!user.data) return notFound()

    return (

        <div className={'bg-card/80 rounded-sm border border-solid border-input w-full lg:w-1/2 shadow-md'}>
            <div className={'flex items-center py-4 px-6 border-b border-solid border-input text-primary text-sm'}>
                <i className={'h-4 w-1 bg-primary rounded-lg mr-1'}></i>
                <span>我的信息</span>
            </div>

            <div className={'py-4 px-6 '}>
                <EditUserForm defaultValues={user.data}/>
            </div>
        </div>

    )
}
