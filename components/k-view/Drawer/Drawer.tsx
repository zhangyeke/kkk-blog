"use client"
import {X} from "lucide-react";
import React from "react";
import {Button} from "@/components/ui/button";
import {
    Drawer as ShadDrawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";


export type DrawerProps = {
    title: React.ReactNode
    description?: React.ReactNode
    trigger?: React.ReactNode
    showCloseIcon?: boolean
    footer?: React.ReactNode
} & React.ComponentProps<typeof ShadDrawer>

export function Drawer(props: DrawerProps) {
    const {description, showCloseIcon = true, trigger, footer, title, children, ...drawerProps} = props;
    return (
        <ShadDrawer {...drawerProps}>
            {
                trigger && (
                    <DrawerTrigger asChild={true}>
                        {trigger}
                    </DrawerTrigger>
                )
            }

            <DrawerContent className={'z-[100]'}>
                <DrawerHeader className={'border-b-1 border-solid border-gray-200'}>
                    <DrawerTitle className={'flex items-center justify-between'}>
                        <span>{title}</span>
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
                            <div className={'flex items-center justify-end gap-x-4 w-full'}>
                                <DrawerClose asChild>
                                    <Button variant="outline">取消</Button>
                                </DrawerClose>
                                <Button>确定</Button>
                            </div>
                        ) : footer
                    }

                </DrawerFooter>
            </DrawerContent>
        </ShadDrawer>
    )
}

