import {LoginForm} from "@/components/AuthForm";

export default async function Page() {
    return (
        <div className={'h-[100vh] flex-center bg-cover bg-center'} style={{
            backgroundImage: `url(/images/login_bg.jpg)`
        }}>
            <div className={'shadow-md w-[400px] p-5 rounded-md bg-white dark:bg-black'}>
                <LoginForm></LoginForm>
            </div>
        </div>
    )
}
