"use client"
import {X} from "lucide-react";
import React from "react";
import {
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    Drawer as ShadDrawer
} from "@/components/ui/drawer";
import {cn} from "@/lib/ui/cn";
import {FooterButtons} from "./FooterButtons";


export type DrawerProps = {
    title: React.ReactNode
    description?: React.ReactNode
    trigger?: React.ReactNode
    showCloseIcon?: boolean
    contentClassName?: string
    footer?: React.ReactNode,
    onConfirm?: () => void
    onCancel?: () => void
} & React.ComponentProps<typeof ShadDrawer>

export function Drawer(props: DrawerProps) {
    const {
        description,
        showCloseIcon = true,
        contentClassName,
        trigger,
        footer,
        title,
        children,
        onCancel,
        onConfirm,
        ...drawerProps
    } = props;
    return (
        <ShadDrawer {...drawerProps}>
            {
                trigger && (
                    <DrawerTrigger asChild={true}>
                        {trigger}
                    </DrawerTrigger>
                )
            }

            <DrawerContent className={cn("z-[1001]", contentClassName)}>
                <DrawerHeader className={'border-b-1 border-solid border-gray-200'}>
                    <DrawerTitle className={'flex items-center justify-between'}>
                        {title}
                        {
                            showCloseIcon && (
                                <DrawerClose>
                                    <X className={'cursor-pointer'}/>
                                </DrawerClose>
                            )
                        }

                    </DrawerTitle>
                    <DrawerDescription>{description}</DrawerDescription>
                </DrawerHeader>
                {children}
                <DrawerFooter className={`${footer === null && 'hidden'} border-t-1 border-solid border-gray-200`}>
                    {
                        footer === undefined ? (
                            <FooterButtons className={'px-6'} type={'drawer'} onCancel={onCancel} onConfirm={onConfirm}/>
                        ) : footer
                    }

                </DrawerFooter>
            </DrawerContent>
        </ShadDrawer>
    )
}

