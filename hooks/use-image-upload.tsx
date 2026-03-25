import React, {startTransition, useActionState, useCallback, useEffect, useRef, useState} from "react";
import {uploadImagePromise} from "@/lib/utils";

interface UseImageUploadProps {
    defaultValue?: string;
    onUpload?: (url: string) => void;
}

interface FileChangeEvent {
    target: { files: Array<File> };
}

async function uploadImage(_: unknown, file: File) {
    try {
        return await uploadImagePromise(file)
    } catch (err) {
        console.error(err)
    }
}

export function useImageUpload({defaultValue, onUpload}: UseImageUploadProps = {}) {
    const previewRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(defaultValue || '');
    const [fileName, setFileName] = useState<string | null>(null);
    const [url, action, pending] = useActionState(uploadImage, "")

    const handleThumbnailClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
            (event: React.ChangeEvent<HTMLInputElement> | FileChangeEvent) => {
                const file = event.target.files?.[0];
                if (file) {
                    setFileName(file.name);
                    startTransition(() => action(file));
                    const previewUrl = URL.createObjectURL(file);
                    setPreviewUrl(previewUrl);
                    previewRef.current = previewUrl;
                }
            }
            ,
            [url, onUpload],
        )
    ;

    const handleRemove = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl('');
        setFileName(null);
        previewRef.current = null;
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [previewUrl]);

    useEffect(() => {
        onUpload?.(url || '');
        return () => {
            if (previewRef.current) {
                URL.revokeObjectURL(previewRef.current);
            }
        };
    }, [url]);


    return {
        url,
        pending,
        previewUrl,
        fileName,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        handleRemove,
    };
}