"use client"
import React, {useCallback, useMemo, useState} from "react";
import dayjs from "dayjs";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {dateFormat} from "@/lib/date";
import {Calendar} from "@/components/ui/calendar";
import {cn} from "@/lib/utils";
import {CalendarDays} from "lucide-react";

export type DatePickerProps = {
    value?: string | number | Date
    format?: string
    placeholder?: string
    onChange?: (event: EventValue<string>) => void
} & BaseComponentProps

export function DatePicker({
                               style,
                               className,
                               value,
                               format = 'YYYY-MM-DD',
                               placeholder = '请选择日期',
                               onChange
                           }: DatePickerProps) {
    const [dateValue, setDateValue] = useState(value)

    const [open, setOpen] = useState(false);

    const date = useMemo(() => {
        const d = dayjs(dateValue)
        return d.isValid() ? d.toDate() : undefined;
    }, [dateValue])

    const formatDate = useMemo(() => dateFormat(dateValue, format), [dateValue, format])

    const handleDateChange = useCallback((d?: Date) => {
        setDateValue(d)
        setOpen(false)
        onChange?.({
            target: {
                value: dateFormat(d, format)
            }
        })
    }, [onChange, format])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>

                <Button
                    style={style}
                    variant="outline"
                    id="date"
                    className={cn("justify-start font-normal border-input", className)}
                >
                    <CalendarDays />
                    {formatDate ? formatDate : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date}
                    captionLayout="dropdown"
                    onSelect={handleDateChange}
                />
            </PopoverContent>
        </Popover>
    )
}
