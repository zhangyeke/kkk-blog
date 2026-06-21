import EditUserForm from "../components/EditUserForm";
import {UpdateUserSchema} from "@/validators/user";
import {getMeInfo} from "@/service/user";

export const metadata = {
    title: "个人信息编辑"
}


export default async function Page() {
    const user = await getMeInfo()

    return (
        <div className={'bg-card/80 rounded-sm border border-solid border-input shadow-md py-4'}>
            <EditUserForm defaultValues={user.data as Partial<UpdateUserSchema>}/>
        </div>
    )
}
