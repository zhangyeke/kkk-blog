"use client"
import React from "react";
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Dialog as ShadDialog
} from "@/components/ui/dialog";
import {createTeleporter} from "@/lib/teleporter";
import {merge} from "lodash";
import {FooterButtons} from "./FooterButtons";


export type DialogProps = {
    title?: React.ReactNode
    description?: React.ReactNode
    trigger?: React.ReactNode
    footer?: React.ReactNode
    contentClassName?: string
    onConfirm?: () => void
    onCancel?: () => void
} & React.ComponentProps<typeof ShadDialog>

export function Dialog(props: DialogProps) {
    const {
        description,
        trigger,
        footer,
        title,
        children,
        contentClassName,
        onConfirm,
        onCancel,
        ...dialogProps
    } = props;
    return (
        <ShadDialog {...dialogProps}>
            {
                trigger && (
                    <DialogTrigger asChild={true}>
                        {trigger}
                    </DialogTrigger>
                )
            }

            <DialogContent className={`z-[100] ${contentClassName}`}>
                <DialogHeader className={'px-6 py-3 border-b-1 border-solid border-gray-200'}>
                    <DialogTitle className={'flex items-center justify-between'}>
                        {title}
                    </DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
                <DialogFooter className={`${footer === null && 'hidden'} border-t-1 border-solid border-gray-200 `}>
                    {
                        footer === undefined ? (
                            <FooterButtons className={'px-6'} onCancel={onCancel} onConfirm={onConfirm}/>
                        ) : footer
                    }

                </DialogFooter>
            </DialogContent>
        </ShadDialog>
    )
}


export function showDialog(options: Omit<DialogProps, 'defaultOpen'>) {
    const {children, ...props} = merge({
        title: "标题"
    }, options)
    const root = createTeleporter();

    root.render(
        <Dialog {...props} defaultOpen={true}>
            {children}
        </Dialog>
    )

}