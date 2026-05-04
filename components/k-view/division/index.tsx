import { useMemo } from "react";
import { cn } from "@/lib/utils"

export type DivisionProps = BaseComponentProps & Partial<ContainerProps> & {
  lineClassName?: string;
}

export const Division = ({ lineClassName, className, style, children }: DivisionProps) => {

  const lineStyle = useMemo(() => cn('flex-1 bg-border h-[1px]', lineClassName), [lineClassName])

  return (
    <div className={cn('flex items-center w-full', className)} style={style}>
      <i className={lineStyle} />
      <span className={'mx-2'}>{children}</span>
      <i className={lineStyle} />
    </div>
  )

}