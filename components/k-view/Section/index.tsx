/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-05-01 01:09:15
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 01:11:53
 * @FilePath: \blog\components\k-view\Section\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { cn } from "@/lib/utils";

export function Section({ style, className, children }: ContainerProps & BaseComponentProps) {
  return (
    <div
      className={cn('flex items-center py-4 px-6 border-b border-solid border-input text-primary text-sm', className)}
      style={style}
    >
      <i className={'h-4 w-1 bg-primary rounded-lg mr-1'}></i>
      {children}
    </div>
  )
}