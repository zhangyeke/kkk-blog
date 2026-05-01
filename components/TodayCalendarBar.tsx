/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-05-01 16:52:07
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 17:48:04
 * @FilePath: \blog\components\TodayCalendarBar.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"

import { useEffect, useState } from "react"

import type { TodayCalendar } from "@/lib/date"
import { getTodayCalendar } from "@/lib/date"
import { cn } from "@/lib/utils"


/** 农历月日（上，略小）+ 公历月日与短星期（下，略大）；不含年份；每 30 分钟刷新 */
export function TodayCalendarBar({ className, style }: BaseComponentProps) {
  const [cal, setCal] = useState<TodayCalendar>(() => getTodayCalendar())

  useEffect(() => {
    const id = window.setInterval(() => setCal(getTodayCalendar()), 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const { lunarMonthDay, gregorianLine } = cal

  return (
    <div
      style={style}
      className={cn(`flex flex-col items-center gap-1 `, className)}
      aria-label={`农历${lunarMonthDay}，${gregorianLine}`}
    >
      <p className="text-lg font-semibold tracking-wide sm:text-xl">{gregorianLine}</p>
    </div>
  )
}
