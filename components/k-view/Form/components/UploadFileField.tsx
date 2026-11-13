"use client"
import React from "react";
import { FileUploadCard, UploadedFile, uploadedFileFromRemoteUrl } from "@/components/ui/file-upload-card";
import { UploadRouteSelect } from "@/components/ui/upload-route-select";
import { uploadImagePromise } from "@/lib/utils";
import { DEFAULT_UPLOAD_ROUTE, type UploadRouteId } from "@/lib/image-upload-routes";
import { CustomControlProps } from "../type";
import { Textarea } from "@/components/ui/textarea"

type UploadFileState = {
    urls: string[]
    uploading: boolean
    hasErrors: boolean
}

function urlsFromValue(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    }
    if (typeof value === "string" && value.trim().length > 0) return [value.trim()];
    return [];
}

function valueUrlsKey(value: unknown): string {
    return JSON.stringify(urlsFromValue(value));
}

type UploadFileFieldProps = Partial<CustomControlProps> & {
    onUploadStateChange?: (state: UploadFileState) => void
    routeSelectContentClassName?: string
}

export default function UploadFileField({
    onChange, onUploadStateChange, routeSelectContentClassName, name, value, ...props
}: UploadFileFieldProps) {
    const [route, setRoute] = React.useState<UploadRouteId>(DEFAULT_UPLOAD_ROUTE)
    const [files, setFiles] = React.useState<UploadedFile[]>(() =>
        urlsFromValue(value).map((href, i) => uploadedFileFromRemoteUrl(href, i)),
    );

    const filesRef = React.useRef(files);
    filesRef.current = files;

    const prevValueKeyRef = React.useRef<string>(valueUrlsKey(value));

    React.useEffect(() => {
        const key = valueUrlsKey(value);
        if (prevValueKeyRef.current === key) return;
        if (filesRef.current.some((f) => f.status === "uploading")) return;
        prevValueKeyRef.current = key;
        setFiles(urlsFromValue(value).map((href, i) => uploadedFileFromRemoteUrl(href, i)));
    }, [value]);

    const uploadState = React.useMemo<UploadFileState>(() => ({
        urls: files.flatMap((file) => file.status === "completed" && file.uploadedUrl ? [file.uploadedUrl] : []),
        uploading: files.some((file) => file.status === "uploading"),
        hasErrors: files.some((file) => file.status === "error"),
    }), [files])

    React.useEffect(() => {
        onChange?.({
            target: {
                name,
                value: uploadState.urls,
            },
        });
        onUploadStateChange?.(uploadState)
    }, [name, onChange, onUploadStateChange, uploadState]);

    const handleFilesChange = (newItems: UploadedFile[]) => {
        setFiles((prev) => [...prev, ...newItems]);
        for (const item of newItems) {
            const { file, id } = item;
            if (item.status !== "uploading") continue;
            uploadImagePromise(file, true, route)
                .then((url) => {
                    setFiles((prev) =>
                        prev.map((row) =>
                            row.id === id
                                ? {
                                    ...row,
                                    progress: 100,
                                    status: "completed",
                                    uploadedUrl: url || undefined,
                                }
                                : row
                        )
                    );
                })
                .catch(() => {
                    setFiles((prev) =>
                        prev.map((row) =>
                            row.id === id ? { ...row, status: "error" } : row
                        )
                    );
                });
        }
    };

    const handleFileRemove = (id: string) => {
        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    };

    return (
        <FileUploadCard
            files={files}
            {...props}
            headerAction={
                <UploadRouteSelect
                    value={route}
                    onChange={setRoute}
                    disabled={uploadState.uploading}
                    contentClassName={routeSelectContentClassName}
                />
            }
            onFilesChange={handleFilesChange}
            onFileRemove={handleFileRemove}
        />
    );
}




/** 将富文本/多行粘贴按行切成非空字符串（一行一个链接时常用） */
export function splitLinesToUrls(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

export function UploadFileTextarea({ onChange, name, value, ...props }: CustomControlProps) {
    const lineValue = Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";

    return (
        <Textarea
            {...props}
            name={name}
            value={lineValue}
            onChange={(e) => {
                const urls = splitLinesToUrls(e.target.value);
                onChange?.({
                    target: {
                        name,
                        value: urls,
                    },
                });
            }}
        />
    );
}
