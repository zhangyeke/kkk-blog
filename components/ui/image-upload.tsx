"use client"

import React, {useCallback, useState} from "react"
import {env} from "env.mjs"
import {ImagePlus, Trash2, Upload, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {UploadRouteSelect} from "@/components/ui/upload-route-select"
import {useImageUpload} from "@/hooks/use-image-upload"
import {cn} from "@/lib/ui/cn"
import {DEFAULT_UPLOAD_ROUTE, type UploadRouteId} from "@/lib/uploads/policy"
import { FixSpin } from "@/components/k-view/Loader";
import { Image } from "@/components/k-view/Image";

interface ImageUploadProps extends BaseComponentProps {
    onUpload?: (url: string) => void;
    onRemove?: () => void;
    showUrlInput?: boolean;
    /** 是否显示上传线路选择；默认显示 */
    showRouteSelect?: boolean;
    value?: string;
}

export function ImageUpload({
    className,
    value,
    style,
    onUpload,
    onRemove,
    showUrlInput = true,
    showRouteSelect = true,
}: ImageUploadProps) {
    const [route, setRoute] = useState<UploadRouteId>(DEFAULT_UPLOAD_ROUTE)
    const {
        pending,
        previewUrl,
        fileName,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        handleRemove,
    } = useImageUpload({
        onUpload,
        value,
        route,
    })

    const [isDragging, setIsDragging] = useState(false)
    const removeImage = () => {
        handleRemove()
        onRemove?.()
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const file = e.dataTransfer.files?.[0]
            if (file && file.type.startsWith("image/")) {
                const fakeEvent = {
                    target: {
                        files: [file],
                    },
                }
                handleFileChange(fakeEvent)
            }
        },
        [handleFileChange],
    )

    return (
        <div
            style={style}
            className={cn("relative w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm", className)}
        >

            <div className="space-y-2">
                {/*<h3 className="text-lg font-medium">上传图片</h3>*/}
                {/*<p className="text-sm text-muted-foreground">*/}
                {/*    支持的图片格式: JPG, PNG, GIF*/}
                {/*</p>*/}
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        最大可上传图片大小：{env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}
                    </p>
                    {showRouteSelect && (
                        <UploadRouteSelect
                            value={route}
                            onChange={setRoute}
                            disabled={pending}
                            className="shrink-0"
                        />
                    )}
                </div>
                {showUrlInput && <Input
                    value={previewUrl}
                    placeholder={`输入已有的图片地址`}
                    onChange={(e) => onUpload?.(e.target.value)}
                />}
            </div>
            {pending && <FixSpin text={'上传中...'}/>}
            <Input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {!previewUrl ? (
                <div
                    onClick={handleThumbnailClick}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted",
                        isDragging && "border-primary/50 bg-primary/5",
                    )}
                >
                    <div className="rounded-full bg-background p-3 shadow-sm">
                        <ImagePlus className="h-6 w-6 text-muted-foreground"/>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium">点击上传</p>
                        <p className="text-xs text-muted-foreground">
                            或将图片拖拽到此处
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="group relative h-64 overflow-hidden rounded-lg border">
                        <Image
                            src={previewUrl}
                            alt="Preview"
                            className="size-full transition-transform duration-300 group-hover:scale-105"
                        />
                        <div
                            className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"/>
                        <div
                            className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                                type={'button'}
                                size="sm"
                                variant="secondary"
                                onClick={handleThumbnailClick}
                                className="h-9 w-9 p-0"
                            >
                                <Upload className="h-4 w-4"/>
                            </Button>
                            <Button
                                type={'button'}
                                size="sm"
                                variant="destructive"
                                onClick={removeImage}
                                className="h-9 w-9 p-0"
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                    {fileName && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="truncate">{fileName}</span>
                            <button
                                type="button"
                                onClick={removeImage}
                                className="ml-auto rounded-full p-1 hover:bg-muted"
                            >
                                <X className="h-4 w-4"/>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
