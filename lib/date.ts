import dayjs from "dayjs"

export const dateFormat = (time: number | Date | null, format = 'YYYY-MM-DD HH:mm:ss') => {
    if (!time) return ''

    if (time instanceof Date) return dayjs(time).format(format);

    // 简单的位判断：10位通常是秒，13位是毫秒
    const isSeconds = time.toString().length === 10;
    return isSeconds
        ? dayjs.unix(time).format(format)
        : dayjs(time).format(format);
};