import dayjs from "dayjs"
import lunar from "dayjs-lunar"
import "dayjs/locale/zh-cn"

dayjs.extend(lunar)

export const dateFormat = (time?: number | Date | null | string, format: string = "YYYY-MM-DD HH:mm:ss") => {
  if (!time) return ""
  if (typeof time === "string") return time

  if (time instanceof Date) return dayjs(time).format(format)

  // 简单的位判断：10位通常是秒，13位是毫秒
  const isSeconds = time.toString().length === 10
  return isSeconds ? dayjs.unix(time).format(format) : dayjs(time).format(format)
}

/**
 * 判断传入的日期是否在“今天”之后 (忽略具体时分秒)
 * 适用于：日期选择器禁用逻辑等
 * 如果传入的是明天，则返回 true；如果是今天，则返回 false
 */
export const isAfterToday = (date?: string | number | Date | dayjs.Dayjs): boolean => {
  return dayjs(date).isAfter(dayjs(), "day")
}

/** 今日展示用（不含年份）：农历月日 + 公历月日与短星期 */
export type TodayCalendar = {
  /** 农历月日，如 三月十五 */
  lunarMonthDay: string
  /** 公历行，如 5 月 01 日 周五 */
  gregorianLine: string
}

/**
 * 今日农历月日、公历月日+星期（使用运行环境时区；仅在该函数内切 zh-cn，不修改全局 dayjs locale）。
 */
export function getTodayCalendar(at: Date | string | number | dayjs.Dayjs = new Date()): TodayCalendar {
  const t = dayjs(at).locale("zh-cn")
  const lunarFull = t.lunar("年月日")
  const lunarMonthDay = lunarFull.replace(/^.*?年/u, "").trim() || lunarFull
  const month = t.format("M")
  const day = t.format("DD")
  const weekShort = t.format("ddd")
  const gregorianLine = `${month} 月 ${day} 日 ${weekShort}`

  return { lunarMonthDay, gregorianLine }
}
