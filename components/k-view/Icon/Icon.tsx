import React from "react";
import { cn } from "@/lib/ui/cn";

export type IconProps = {
  name: string
} & BaseComponentProps &
  React.HTMLAttributes<HTMLDivElement>

export function Icon({ name, className, style, ...props }: IconProps) {
  return <i style={style} className={cn(`iconfont icon-${name} text-base`, className)} {...props}></i>
}
