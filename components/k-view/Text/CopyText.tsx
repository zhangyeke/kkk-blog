"use client";

import React, {useEffect, useState} from "react";
import {Copy} from "lucide-react";
import {useCopyToClipboard} from "react-use";
import {toast} from "sonner";
import {cn} from "@/lib/utils";

export interface CopyTextProps extends BaseComponentProps, Omit<React.HTMLAttributes<HTMLDivElement>, "onCopy"> {
    /** 需要复制到剪贴板中的文本内容 */
    text: string;
    /** 容器内部展示的内容 */
    children: React.ReactNode;
    /** 未复制时鼠标悬停显示的提示文案 */
    copyLabel?: string;
    /** 复制成功后的 toast 提示文案 */
    successMessage?: string;
    /** 是否禁用复制行为 */
    disabled?: boolean;
    /** 是否在右侧显示复制状态图标 */
    showIcon?: boolean;
    /** 复制成功后的回调，返回已复制的文本 */
    onCopy?: (text: string) => void;
}

export const CopyText = (props: CopyTextProps) => {
    const {
        text,
        children,
        className,
        style,
        copyLabel = "点击复制",
        successMessage = "复制成功",
        disabled = false,
        showIcon = false,
        onCopy,
        onClick,
        ...restProps
    } = props;

    const [copyState, copyToClipboard] = useCopyToClipboard();
    const [pendingText, setPendingText] = useState<string | null>(null);

    useEffect(() => {
        if (!pendingText) return;

        if (copyState.error) {
            toast.error("复制失败");
            setPendingText(null);
            return;
        }

        if (copyState.value === pendingText) {
            toast.success(successMessage);
            onCopy?.(pendingText);
            setPendingText(null);
        }
    }, [copyState.error, copyState.value, onCopy, pendingText, successMessage]);

    const performCopy = () => {
        if (disabled || !text) return;

        setPendingText(text);
        copyToClipboard(text);
    };

    const handleClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
        performCopy();
        onClick?.(event);
    };

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            title={copyLabel}
            className={cn(
                "inline-flex cursor-pointer items-center gap-x-1 transition-opacity",
                disabled && "cursor-not-allowed opacity-60",
                className
            )}
            style={style}
            {...restProps}
            onClick={handleClick}
        >
            {children}
            {showIcon && <Copy className="size-4"/>}
        </div>
    );
};
