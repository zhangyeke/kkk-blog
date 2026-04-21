import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {uploadImagePromise} from "@/lib/utils";

interface UseImageUploadProps {
    value?: string;
    onUpload?: (url: string) => void;
}

interface FileChangeEvent {
    target: { files: Array<File> };
}

export function useImageUpload({value, onUpload}: UseImageUploadProps = {}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(value || '');
    const [fileName, setFileName] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const handleThumbnailClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback(
            (event: ChangeEvent<HTMLInputElement> | FileChangeEvent) => {
                const file = event.target.files?.[0];
                if (file) {
                    setFileName(file.name);
                    setPending(true)
                    uploadImagePromise(file).then(url => {
                        setPreviewUrl(url)
                        onUpload?.(url)
                    }).finally(() => {
                        setPending(false)
                    })

                }
            }
            ,
            [onUpload],
        )
    ;

    const handleRemove = useCallback(() => {
        setPreviewUrl('');
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [previewUrl]);


    useEffect(() => {
        if (value) {
            setPreviewUrl(value)
        } else {
            handleRemove()
        }
    }, [value]);


    return {
        pending,
        previewUrl,
        fileName,
        fileInputRef,
        handleThumbnailClick,
        handleFileChange,
        handleRemove,
    };
}