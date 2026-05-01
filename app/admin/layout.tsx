
export const metadata = {
    title: {
        template: '%s | kkkの后台',
        default: 'kkkの后台管理系统',
    }
}

export default async function Layout({children}: ContainerProps) {

    return (
        <main>
            {children}
        </main>
    )
}
