import {motion} from 'framer-motion';
import Link from "next/link";
import {cn} from "@/lib/utils";
import {Drawer, Image, LucideIcon} from "@/components/k-view"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

import {Session} from "next-auth";
import {LogOut, Menu} from 'lucide-react';
import {DrawerClose} from "@/components/ui/drawer";
import {LogOutButton} from "./LogOutButton";
import NotLoginAvatar from "./NotLoginAvatar";

type ToggleButtonProps = {
    isOpen?: boolean
    onChange?: (isOpen: boolean) => void
} & BaseComponentProps

const ToggleButton = ({style, className, isOpen, onChange}: ToggleButtonProps) => {


    // 定义线条的动画变量
    const lineVariants = {
        closed: {rotate: 0, y: 0, opacity: 1},
        open: (custom: number) => ({
            rotate: custom === 1 ? 45 : custom === 3 ? -45 : 0,
            y: custom === 2 ? 0 : custom === 1 ? 6 : -6, // 调整Y轴使线条重合
            opacity: custom === 2 ? 0 : 1,
        }),
    };

    return (
        <button
            style={style}
            className={cn("transition-all mr-4 text-primary relative z-[11000]", className)}
            aria-label="Toggle Menu"
            onClick={() => onChange?.(!isOpen)}
        >

            <svg
                className={'stroke-current'}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {/* 上横线 */}
                <motion.line
                    x1="3" y1="6" x2="21" y2="6"
                    custom={1}
                    variants={lineVariants}
                    animate={isOpen ? "open" : "closed"}
                    transition={{type: "spring", stiffness: 300, damping: 20}}
                />
                {/* 中横线 */}
                <motion.line
                    x1="3" y1="12" x2="21" y2="12"
                    custom={2}
                    variants={lineVariants}
                    animate={isOpen ? "open" : "closed"}
                    transition={{type: "spring", stiffness: 300, damping: 20}}
                />
                {/* 下横线 */}
                <motion.line
                    x1="3" y1="18" x2="21" y2="18"
                    custom={3}
                    variants={lineVariants}
                    animate={isOpen ? "open" : "closed"}
                    transition={{type: "spring", stiffness: 300, damping: 20}}
                />
            </svg>

        </button>
    );
};


type MobileNavigationProps = {
    menuList: NavigationMenuType[]
    session: Session | null
} & BaseComponentProps

const UserInfo = ({session}: Pick<MobileNavigationProps, 'session'>) => {
    if (!session) return <NotLoginAvatar/>
    return (
        <DrawerClose className={'flex items-center w-full'}>
            <Link className={'flex items-center gap-x-2 flex-1'} href={'/blog/me'}>
                <Image className={'rounded-full size-8 shadow-md'} src={session.user.avatar || ''}/>
                <span>{session.user.name}</span>
            </Link>
            <Link className={'text-xs text-gray-600 flex items-center gap-x-1'} href={'/blog/article/write'}>
                写文章
                <LucideIcon className={'size-4'} name={'arrow-right'}/>
            </Link>
        </DrawerClose>
    )
}

const Exit = () => {
    return (
        <LogOutButton
            className={'flex items-center gap-x-2 size-full px-4 py-2 cursor-pointer border-none outline-none'}>
            <LogOut className={'size-4.5'}/>
            退出登录
        </LogOutButton>
    )
}

const MobileNavigation = ({style, className, menuList, session}: MobileNavigationProps) => {
    const defaultValues = menuList.map((_, i) => String(i));

    return (
        <>
            <Drawer
                showCloseIcon={!session}
                direction={'right'}
                title={<UserInfo session={session}/>}
                trigger={<Menu style={style} className={cn('text-primary text-lg mr-4 ', className)}/>}
                footer={session ? <Exit/> : null}
            >

                <Accordion
                    type="multiple"
                    defaultValue={defaultValues}
                    className="p-2 flex flex-col gap-y-2"
                >
                    {
                        menuList.map((item, i) => {
                            if (Array.isArray(item.children)) {
                                return (
                                    <AccordionItem className={'border-none'} value={String(i)} key={i}>
                                        <AccordionTrigger className={'text-base py-0'}>{item.name}</AccordionTrigger>
                                        <AccordionContent
                                            className={'ml-3.5 py-4 flex flex-col gap-y-3 px-3 border-l-1 border-input border-solid'}>
                                            {
                                                item.children.map((menu, index) => (
                                                    <DrawerClose className={'text-left'} key={index + `${i}`}>
                                                        <Link href={menu.href || ''}>{menu.name}</Link>
                                                    </DrawerClose>
                                                ))
                                            }
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            }

                            return (
                                <DrawerClose key={i}>
                                    <Link
                                        className={'flex items-center justify-between '}
                                        href={item.href || ''}
                                    >
                                        <span>{item.name}</span>
                                        <LucideIcon className={'size-4 text-muted-foreground'} name={'ChevronRight'}/>
                                    </Link>
                                </DrawerClose>

                            )
                        })
                    }

                </Accordion>
            </Drawer>
        </>
    )
}


export default MobileNavigation;