export default async function Layout({children}: Slots<'children'>) {

    return (
        <div className={'h-[100vh] flex-center bg-cover bg-center'} style={{
            backgroundImage: `url(/images/login_bg.jpg)`
        }}>
            <div className={'shadow-md w-[400px]  rounded-md bg-white dark:bg-black'}>
                {children}
            </div>
        </div>
    )
}
