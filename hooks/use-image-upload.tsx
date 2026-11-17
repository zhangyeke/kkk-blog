import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react";
import {uploadImagePromise} from "@/lib/uploads/client";
import {DEFAULT_UPLOAD_ROUTE, type UploadRouteId} from "@/lib/uploads/policy";

interface UseImageUploadProps {
    value?: string;
    onUpload?: (url: string) => void;
    /** 上传线路；不传则沿用服务端默认 */
    route?: UploadRouteId;
}

interface FileChangeEvent {
    target: { files: Array<File> };
}

export function useImageUpload({value, onUpload, route = DEFAULT_UPLOAD_ROUTE}: UseImageUploadProps = {}) {
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
                    uploadImagePromise(file, true, route).then(url => {
                        setPreviewUrl(url)
                        onUpload?.(url)
                    }).catch(() => {
                        // The shared uploader shows the error; keep the previous image for retry.
                    }).finally(() => {
                        setPending(false)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                    })

                }
            }
            ,
            [onUpload, route],
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
