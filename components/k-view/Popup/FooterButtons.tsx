"use client"
import React from "react"
import {DialogClose} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {DrawerClose} from "@/components/ui/drawer";
import {cn} from "@/lib/utils";

export interface FooterButtonsProps extends BaseComponentProps {
    type?: 'dialog' | 'drawer';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function PopupClose({type, children}: Pick<FooterButtonsProps, 'type'> & ContainerProps) {
    if (type === 'dialog') {
        return (
            <DialogClose asChild>
                {children}
            </DialogClose>
        )
    }

    if (type === 'drawer') {
        return (
            <DrawerClose asChild>
                {children}
            </DrawerClose>
        )
    }
    return (<>{children}</>)
}

export function FooterButtons(props: FooterButtonsProps) {
    const {type, cancelText = '取消', confirmText = '确定', style, className, onCancel, onConfirm} = props;
    return (
        <div style={style} className={cn('flex items-center justify-end gap-x-4 w-full py-4', className)}>
            <PopupClose type={type}>
                <Button type={'button'} variant="outline" onClick={onCancel}>{cancelText}</Button>
            </PopupClose>
            <Button type={'button'} onClick={onConfirm}>{confirmText}</Button>
        </div>
    )
}
