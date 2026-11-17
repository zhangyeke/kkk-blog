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
import {createTeleporter} from "@/lib/ui/teleporter";
import {cn} from "@/lib/ui/cn";
import {merge} from "lodash";
import {FooterButtons} from "./FooterButtons";


export type DialogProps = {
    title?: React.ReactNode
    description?: React.ReactNode
    trigger?: React.ReactNode
    footer?: React.ReactNode
    headerClassName?: string
    titleClassName?: string
    footerClassName?: string
    contentClassName?: string
    contentProps?: Omit<React.ComponentProps<typeof DialogContent>, "children" | "className"> & {
        "data-preset"?: string
        "data-vaul-no-drag"?: boolean
    }
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
        headerClassName,
        titleClassName,
        footerClassName,
        contentClassName,
        contentProps,
        onConfirm,
        onCancel,
        ...dialogProps
    } = props;
    const hasDescription = description !== null && description !== undefined && description !== false && description !== "";
    const contentAccessibilityProps = !hasDescription && !contentProps?.["aria-describedby"]
        ? { "aria-describedby": undefined }
        : {};
    return (
        <ShadDialog {...dialogProps}>
            {
                trigger && (
                    <DialogTrigger asChild={true}>
                        {trigger}
                    </DialogTrigger>
                )
            }

            <DialogContent {...contentProps} {...contentAccessibilityProps} className={cn("z-100", contentClassName)}>
                <DialogHeader className={cn("px-6 py-3 border-b border-solid border-gray-200", headerClassName)}>
                    <DialogTitle className={cn("flex items-center justify-between", titleClassName)}>
                        {title}
                    </DialogTitle>
                    {hasDescription && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                {children}
                <DialogFooter className={cn("border-t border-solid border-gray-200", footer === null && "hidden", footerClassName)}>
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
