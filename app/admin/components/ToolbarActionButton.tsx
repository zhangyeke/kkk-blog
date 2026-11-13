import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ToolbarActionButtonProps = Omit<ComponentProps<typeof Button>, "variant" | "size">

export function ToolbarActionButton({
    asChild,
    className,
    type = "button",
    ...props
}: ToolbarActionButtonProps) {
    return (
        <Button
            {...props}
            asChild={asChild}
            type={asChild ? undefined : type}
            variant={null}
            size={null}
            className={cn(
                "h-8 gap-1 px-3 text-sm md:text-base transition-colors",
                "bg-[var(--adm-c1)] text-[color:var(--adm-paper-2)]",
                "hover:bg-[var(--adm-action-hover,var(--adm-c1))] active:bg-[var(--adm-action-active,var(--adm-c1))]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--adm-c1)]",
                className,
            )}
        />
    )
}
