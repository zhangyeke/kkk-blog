import dayjs from "dayjs"

export const dateFormat = (time?: number | Date | null | string, format: string = 'YYYY-MM-DD HH:mm:ss') => {
    if (!time) return ''
    if (typeof time === 'string') return time

    if (time instanceof Date) return dayjs(time).format(format);

    // 简单的位判断：10位通常是秒，13位是毫秒
    const isSeconds = time.toString().length === 10;
    return isSeconds
        ? dayjs.unix(time).format(format)
        : dayjs(time).format(format);
};

/**
 * 判断传入的日期是否在“今天”之后 (忽略具体时分秒)
 * 适用于：日期选择器禁用逻辑等
 * 如果传入的是明天，则返回 true；如果是今天，则返回 false
 */
export const isAfterToday = (date?: string | number | Date | dayjs.Dayjs): boolean => {
    return dayjs(date).isAfter(dayjs(), 'day');
};
