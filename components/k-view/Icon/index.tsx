import React from "react"
import { LucideProps } from "lucide-react"
import { cn, toKebabCase } from "@/lib/utils"
import { dynamicIconImports } from "lucide-react/dynamic"
import dynamic from "next/dynamic"

export type IconProps = {
  name: string
} & BaseComponentProps &
  React.HTMLAttributes<HTMLDivElement>

export function Icon({ name, className, style, ...props }: IconProps) {
  return <i style={style} className={cn(`iconfont icon-${name} text-base`, className)} {...props}></i>
}

interface LucideIconProps extends Omit<LucideProps, "ref"> {
  name: string
}

export function LucideIcon({ name, ...props }: LucideIconProps) {
  // 1. 将 'ArrowRight' 转换成 'arrow-right'
  const kebabName = toKebabCase(name) as keyof typeof dynamicIconImports

  // 2. 安全性校验：如果传入的图标名称不存在，则渲染一个兜底图标（例如 help-circle）
  if (!dynamicIconImports[kebabName]) {
    console.warn(`[Lucide Icon] 图标 "${name}" (${kebabName}) 未找到，已自动渲染兜底图标`)
    const FallbackIcon = dynamic(dynamicIconImports["help-circle"])
    return <FallbackIcon {...props} />
  }

  // 3. 动态加载对应的图标块
  const Icon = dynamic(dynamicIconImports[kebabName])

  return <Icon {...props} />
}
