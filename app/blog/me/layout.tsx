export default async function Layout({children}: Slots<'children'>) {

    return (
        <div className={'flex-1 flex-center bg-center bg-cover  random-bg-img dark:bg-none'}>
            {children}
        </div>
    )
}
