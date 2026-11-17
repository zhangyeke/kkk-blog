/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-10-22 18:29:07
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-25 22:42:46
 * @FilePath: \blog\components\k-view\Popup\FooterButtons.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React from "react"
import { DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import { cn } from "@/lib/ui/cn";

export interface FooterButtonsProps extends BaseComponentProps {
    type?: 'dialog' | 'drawer';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export function PopupClose({ type, children }: Pick<FooterButtonsProps, 'type'> & ContainerProps) {
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

export function FooterButtons(props: FooterButtonsProps & Partial<ContainerProps>) {
    const { children, type, cancelText = '取消', confirmText = '确定', style, className, onCancel, onConfirm } = props;
    return (
        <div style={style} className={cn('flex w-full flex-col-reverse items-stretch justify-end gap-2 py-4 sm:flex-row sm:items-center sm:gap-x-4 [&>*]:min-h-11 [&>*]:w-full sm:[&>*]:min-h-9 sm:[&>*]:w-auto', className)}>
            {
                children ? children : (
                    <>
                        <PopupClose type={type}>
                            <Button type={'button'} variant="outline" className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={onCancel}>{cancelText}</Button>
                        </PopupClose>
                        <Button type={'button'} className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={onConfirm}>{confirmText}</Button>
                    </>
                )
            }

        </div>
    )
}
