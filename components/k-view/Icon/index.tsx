import { CircleHelp } from "lucide-react"
import { DynamicIcon, iconNames } from "lucide-react/dynamic"
import type { IconName } from "lucide-react/dynamic"
import type { LucideProps } from "lucide-react"

/** String based Lucide icon props. Names accept `ArrowRight`, `arrow-right`, or `arrow_right`. */
export type IconProps = Omit<LucideProps, "ref"> & {
  name: string
}

const availableIconNames = new Set<string>(iconNames)

function normalizeIconName(name: string): string {
  return name
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
}

/** Render a Lucide icon by name without creating a new dynamic component on each render. */
export function LucideIcon({ name, ...props }: IconProps) {
  const normalizedName = normalizeIconName(name)

  if (!availableIconNames.has(normalizedName)) {
    return <CircleHelp {...props} />
  }

  return <DynamicIcon name={normalizedName as IconName} {...props} />
}

/** Main package entry renders Lucide icons; the legacy iconfont remains available by name. */
export function Icon(props: IconProps) {
  return <LucideIcon {...props} />
}

export { Icon as IconFont, type IconProps as IconFontProps } from "./Icon"
