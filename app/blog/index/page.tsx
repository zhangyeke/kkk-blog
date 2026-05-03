/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-05-01 12:32:17
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-03 19:01:03
 * @FilePath: \blog\app\blog\index\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import FlipClock from "@/components/FlipClock"
import { GlassSearchBar } from "@/components/GlassSearchBar"
import { TodayCalendarBar } from "@/components/TodayCalendarBar"

import MountainVistaParallax from "@/components/ui/mountain-vista-bg"

export const metadata = {
  title: "起始页",
}

export default function IndexPage() {
  return (
    <div className="h-screen bg-primary/20 dark:bg-transparent">
      <MountainVistaParallax />
      <div className="lg:w-[600px] -mt-24 mx-auto relative z-10 flex h-full flex-col items-center justify-center gap-4 text-center">
        <FlipClock className="text-6xl font-bold text-white" />
        <TodayCalendarBar className="text-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
        <GlassSearchBar className="mt-2 " />
      </div>
    </div>
  )
}