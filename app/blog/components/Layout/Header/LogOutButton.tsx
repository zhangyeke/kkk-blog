import {logout} from "@/service/auth";



export function LogOutButton({className,children}: BaseComponentProps & ContainerProps) {
    return (
        <form action={logout} className={'size-full'}>
            <button
                type={'submit'}
                className={className}
            >
                {children}
            </button>
        </form>
    );
}