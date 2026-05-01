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
import { cn } from "@/lib/utils";

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
        <div style={style} className={cn('flex items-center justify-end gap-x-4 w-full py-4', className)}>
            {
                children ? children : (
                    <>
                        <PopupClose type={type}>
                            <Button type={'button'} variant="outline" onClick={onCancel}>{cancelText}</Button>
                        </PopupClose>
                        <Button type={'button'} onClick={onConfirm}>{confirmText}</Button>
                    </>
                )
            }

        </div>
    )
}
