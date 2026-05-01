import * as React from "react";
import { CheckCircle2, Trash2, UploadCloud, X } from "lucide-react";
import { AnimatePresence, HTMLMotionProps, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Image } from "@/components/k-view/Image";
import { env } from "@/env.mjs";
import { toast } from "sonner";

/** 与 `env.mjs` 中 NEXT_PUBLIC_IMG_UPLOAD_LIMIT 一致：按 MB 解析（如 "3mb" 得到 3），无效则不在客户端限制大小 */
const MAX_UPLOAD_BYTES = (() => {
    const mb = parseInt(env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT, 10);
    return Number.isFinite(mb) && mb > 0 ? mb * 1024 * 1024 : Number.POSITIVE_INFINITY;
})();

/**
 * 判断文件是否满足 `accept` 规则（与 `<input accept>` 常见写法兼容：扩展名、MIME、通配如 image/*）。
 * `accept` 为空或未传时不应调用本函数做拒绝逻辑（表示允许全部）。
 */
function fileMatchesAccept(file: File, accept: string): boolean {
    const tokens = accept
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    if (tokens.length === 0) return true;

    for (const token of tokens) {
        if (token === "*/*") return true;
        if (token.startsWith(".")) {
            const ext = token.toLowerCase();
            if (file.name.toLowerCase().endsWith(ext)) return true;
            continue;
        }
        if (token.endsWith("/*")) {
            const major = token.slice(0, -2).toLowerCase();
            const mime = file.type.toLowerCase();
            if (mime.startsWith(`${major}/`)) return true;
            continue;
        }
        if (file.type.toLowerCase() === token.toLowerCase()) return true;
    }
    return false;
}

/** 将远程链接包装为 File（内容为 URL 文本，type 为 application/url，便于列表展示与 `file.text()` 取回链接） */
function fileFromRemoteUrl(href: string): File {
    let name: string;
    try {
        const u = new URL(href);
        const last = u.pathname.split("/").filter(Boolean).pop();
        if (last && last.includes(".")) {
            name = last.length <= 120 ? last : last.slice(-120);
        } else {
            const base = `${u.hostname}${u.pathname === "/" ? "" : u.pathname}`;
            name = base.length <= 120 ? base || "link.url" : base.slice(-120);
        }
    } catch {
        name = "link.url";
    }

    return new File([href], name, { type: "application/url" });
}

/** 由已有 http(s) 地址构造一条已完成的上传项（与「使用链接」提交后的形状一致） */
export function uploadedFileFromRemoteUrl(href: string, index: number): UploadedFile {
    const file = fileFromRemoteUrl(href);
    return {
        id: `preset-${index}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`,
        file,
        previewUrl: href,
        progress: 100,
        status: "completed",
        uploadedUrl: href,
    };
}

function revokePreviewUrlIfBlob(url: string) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

/** 单条上传项：由父组件维护 id、进度与状态 */
export interface UploadedFile {
    id: string;
    file: File;
    /**
     * 缩略图地址：本地图片为 `blob:`（`URL.createObjectURL`）；用户输入的完整 http(s) 链接可与 `application/url` 条目共用该字段。
     * 仅 blob 会在列表变化 / 卸载时 revoke。
     */
    previewUrl?: string;
    /** 上传进度 0–100 */
    progress: number;
    status: "uploading" | "completed" | "error";
    /** `uploadImagePromise` 等服务端上传成功后的地址 */
    uploadedUrl?: string;
}

function mapIncomingFilesToItems(files: File[]): UploadedFile[] {
    const t = Date.now();
    return files.map((file, i) => ({
        id: `${file.name}-${t}-${i}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        progress: 0,
        status: "uploading" as const,
    }));
}

interface FileUploadCardProps extends HTMLMotionProps<"div"> {
    /** 当前展示的上传列表 */
    files: UploadedFile[];
    /** 用户新增条目时回调（卡片内已拼装 id / progress / status） */
    onFilesChange: (items: UploadedFile[]) => void;
    /** 从列表中移除某一项 */
    onFileRemove: (id: string) => void;
    /** 可选：关闭整张卡片（例如弹层） */
    onClose?: () => void;
    /**
     * 允许的文件类型，语义同原生 `<input type="file" accept>`（如 `image/*`、`.pdf,.doc`、`image/png,video/mp4`）。
     * 未传或空字符串表示不限制；拖放与选择后都会按此过滤，与系统文件选择器行为一致。
     */
    accept?: string;
    placeholder?: string;

}

/**
 * 文件上传卡片：支持点击选择、拖放、多文件，并展示每项进度与完成状态。
 */
export const FileUploadCard = React.forwardRef<HTMLDivElement, FileUploadCardProps>(
    ({ className, files = [], onFilesChange, onFileRemove, onClose, accept,placeholder = '选择并上传您所选择的文件', ...props }, ref) => {

        /** 拖放区是否处于 drag-over 高亮 */
        const [isDragging, setIsDragging] = React.useState(false);
        const [linkInput, setLinkInput] = React.useState("");
        const fileInputRef = React.useRef<HTMLInputElement>(null);

        const acceptTrimmed = accept?.trim() ?? "";
        const acceptAttr = acceptTrimmed.length > 0 ? acceptTrimmed : undefined;

        const previewBlobUrlsRef = React.useRef<Map<string, string>>(new Map());

        React.useEffect(() => {
            const next = new Map<string, string>();
            for (const f of files) {
                if (f.previewUrl) next.set(f.id, f.previewUrl);
            }
            previewBlobUrlsRef.current.forEach((url, id) => {
                const nu = next.get(id);
                if (nu === undefined || nu !== url) {
                    revokePreviewUrlIfBlob(url);
                }
            });
            previewBlobUrlsRef.current = new Map(next);
        }, [files]);

        React.useEffect(() => {
            return () => {
                previewBlobUrlsRef.current.forEach((url) => revokePreviewUrlIfBlob(url));
                previewBlobUrlsRef.current.clear();
            };
        }, []);

        const filterByAccept = (list: File[]) => {
            if (!acceptTrimmed) return list;
            return list.filter((f) => fileMatchesAccept(f, acceptTrimmed));
        };

        /** 按环境变量单文件大小上限过滤；超限文件会 toast 提示 */
        const filterByMaxSize = (list: File[]) => {
            if (!Number.isFinite(MAX_UPLOAD_BYTES)) return list;
            const ok: File[] = [];
            let rejected = 0;
            for (const f of list) {
                if (f.size <= MAX_UPLOAD_BYTES) ok.push(f);
                else rejected += 1;
            }
            if (rejected > 0) {
                toast.error(
                    `文件大小超过限制，最大可上传 ${env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}`,
                );
            }
            return ok;
        };

        const prepareIncomingFiles = (list: File[]) =>
            filterByMaxSize(filterByAccept(list));

        const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
        };

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
        };

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            const droppedFiles = prepareIncomingFiles(Array.from(e.dataTransfer.files));
            if (droppedFiles.length > 0) {
                onFilesChange(mapIncomingFilesToItems(droppedFiles));
            }
        };

        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = prepareIncomingFiles(Array.from(e.target.files || []));
            e.target.value = "";
            if (selectedFiles.length > 0) {
                onFilesChange(mapIncomingFilesToItems(selectedFiles));
            }
        };

        /** 程序化触发隐藏的 file input */
        const triggerFileSelect = () => fileInputRef.current?.click();

        const handleLinkSubmit = () => {
            const raw = linkInput.trim();
            if (!raw) {
                toast.error("请输入链接");
                return;
            }
            let href: string;
            try {
                const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
                if (u.protocol !== "http:" && u.protocol !== "https:") {
                    toast.error("仅支持 http / https 链接");
                    return;
                }
                href = u.href;
            } catch {
                toast.error("请输入有效链接");
                return;
            }
            onFilesChange(
                mapIncomingFilesToItems([fileFromRemoteUrl(href)]).map((item) => ({
                    ...item,
                    previewUrl: href,
                    progress: 100,
                    status: "completed" as const,
                    uploadedUrl: href,
                })),
            );
            setLinkInput("");
        };

        /** 将字节数格式化为可读大小（Bytes / KB / …） */
        const formatFileSize = (bytes: number) => {
            if (bytes === 0) return "0 KB";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

        const cardVariants = {
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
        };

        const fileItemVariants = {
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
        };

        return (
            <motion.div
                ref={ref}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.3 }}
                className={cn(
                    "w-full max-w-lg bg-background rounded-xl border border-input shadow-sm",
                    className
                )}
                {...props}
            >
                <div className="p-6">
                    {/* 标题区 + 可选关闭 */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted">
                                <UploadCloud className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">上传文件</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {placeholder}
                                </p>
                            </div>
                        </div>
                        {onClose && (
                            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            type="url"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            placeholder="已有文件链接，https://…"
                            className="sm:flex-1"
                        />
                        <Button type="button" className="shrink-0" onClick={handleLinkSubmit}>
                            使用链接
                        </Button>
                    </div>

                    {/* 拖放 / 点击选择区域（hidden input 由整区 click 触发） */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={cn(
                            "mt-6 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 cursor-pointer",
                            isDragging
                                ? "border-primary bg-primary/10"
                                : "border-muted-foreground/30 hover:border-primary/50"
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={acceptAttr}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                        <p className="font-semibold text-foreground">选择一个文件或将其拖放到此处</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            单文件不超过 {env.NEXT_PUBLIC_IMG_UPLOAD_LIMIT}
                            {acceptTrimmed ? "，类型以当前选择为准" : ""}
                        </p>
                        <Button variant="outline" size="sm" className="mt-4 pointer-events-none">
                            浏览文件
                        </Button>
                    </div>
                </div>

                {/* 已选文件列表：进度、完成态、删除 */}
                {files.length > 0 && (
                    <div className="p-6 border-t border-input">
                        <ul className="space-y-4 max-h-[300px] overflow-y-auto ">
                            <AnimatePresence>
                                {files.map((file) => {
                                    const showThumb =
                                        Boolean(file.previewUrl) &&
                                        (file.file.type.startsWith("image/") ||
                                            file.file.type === "application/url");
                                    const typeLabel =
                                        file.file.type.split("/")[1]?.toUpperCase().substring(0, 3) || "FILE";
                                    return (
                                    <motion.li
                                        key={file.id}
                                        variants={fileItemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        layout
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 shrink-0 flex items-center justify-center overflow-hidden rounded-md bg-muted text-sm font-bold text-muted-foreground">
                                                {showThumb ? (
                                                    <Image
                                                        src={file.previewUrl}
                                                        alt={file.file.name}
                                                        className="size-10 rounded-md"
                                                    />
                                                ) : (
                                                    typeLabel
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-xs">{file.file.name}</p>
                                                <div className="text-xs text-muted-foreground">
                                                    {file.status === "uploading" && (
                                                        <span>{formatFileSize((file.file.size * file.progress) / 100)} of {formatFileSize(file.file.size)}</span>
                                                    )}
                                                    {file.status === "completed" && (
                                                        <span>{formatFileSize(file.file.size)}</span>
                                                    )}
                                                    <span className="mx-1">•</span>
                                                    <span className={cn(
                                                        { "text-primary": file.status === 'uploading' },
                                                        { "text-green-500": file.status === 'completed' },
                                                    )}>
                                                        {file.status === 'uploading' ? `Uploading...` : 'Completed'}
                                                    </span>
                                                </div>
                                                {file.status === 'uploading' &&
                                                    <Progress value={file.progress} className="h-1.5 mt-1" />}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {file.status === 'completed' &&
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8"
                                                onClick={() => onFileRemove(file.id)}>
                                                {file.status === 'completed' ? <Trash2 className="w-4 h-4" /> :
                                                    <X className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </motion.li>
                                    );
                                })}
                            </AnimatePresence>
                        </ul>
                    </div>
                )}
            </motion.div>
        );
    }
);
FileUploadCard.displayName = "FileUploadCard";
