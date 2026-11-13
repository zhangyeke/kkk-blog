"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function AdminUserAvatar({
    name,
    avatar,
    sizeClassName = "size-8",
    className,
    title,
}: {
    name: string
    avatar?: string | null
    sizeClassName?: string
    className?: string
    title?: string
}) {
    const imageSrc = avatar?.trim()

    return (
        <Avatar
            role="img"
            aria-label={`${name}头像`}
            title={title}
            className={cn("shrink-0 rounded-full border", sizeClassName, className)}
            style={{borderColor: "var(--adm-line)"}}
        >
            {imageSrc && <AvatarImage src={imageSrc} alt={name} className="object-cover"/>}
            <AvatarFallback
                className="rounded-full text-sm md:text-base"
                style={{
                    background: "linear-gradient(140deg, color-mix(in oklab, var(--adm-c1) 20%, transparent), color-mix(in oklab, var(--adm-c2) 24%, transparent))",
                    color: "var(--adm-ink)",
                }}
            >
                {name.trim().slice(0, 1) || "?"}
            </AvatarFallback>
        </Avatar>
    )
}
