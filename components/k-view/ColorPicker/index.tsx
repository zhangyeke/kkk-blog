"use client"
import RcColorPicker, {Color as RcColor, ColorPickerProps as RcColorPickerProps} from '@rc-component/color-picker';
import '@rc-component/color-picker/assets/index.css';
import React from "react";
import {rgb2hex} from "@/lib/color";
import {Input} from "@/components/ui/input"
import {Separator} from "@/components/ui/separator"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"
import {cn} from "@/lib/utils";

export interface ColorPickerProps extends Pick<RcColorPickerProps, 'panelRender'> {
    onChange?: (color?: string) => void
    onChangeComplete?: (color?: string) => void
    defaultValue?: string
    value?: string
}

export type Color = RcColor


function conversionHex(color: Color | string) {
    const {r, g, b, a} = color
    const rgba = `rgba(${r}, ${g}, ${b}, ${a})`
    return typeof color !== 'string' ? rgb2hex(rgba) : color
}

export type ColorBoxProps = {
    color: string;
    onClick?: (color: string) => void;
} & BaseComponentProps

export function ColorBox({color, style, className, onClick}: ColorBoxProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <i
                    className={cn('size-6 rounded-sm cursor-pointer', className)}
                    style={{
                        ...style,
                        backgroundColor: color,
                    }}
                    onClick={() => onClick?.(color)}
                ></i>
            </TooltipTrigger>
            <TooltipContent className={'z-[102]'}>
                <p>{color}</p>
            </TooltipContent>
        </Tooltip>
    )

}

export function ColorPicker(props: ColorPickerProps) {
    const {defaultValue, panelRender, value, onChange, onChangeComplete} = props
    const [color, setColor] = React.useState(defaultValue || value)
    const presetColors = React.useRef([
        "#fb2c36",
        "#ff2056",
        "#f6339a",
        "#ff6900",
        "#fe9a00",
        "#fdc700",
        "#9ae600",
        "#05df72",
        "#00d492",
        "#00d5be",
        "#00b8db",
        "#00a6f4",
        "#50a2ff",
        "#7c86ff",
        "#a684ff",
        "#c27aff",
        "#615fff",
        "#e12afb",
    ])


    function handleChange(color: Color | string) {
        React.startTransition(() => {
            const value = conversionHex(color)
            setColor(value)
            onChange && onChange(value)
        })
    }

    function handleChangeComplete(color: Color | string) {
        const hex = conversionHex(color)
        setColor(hex)
        onChangeComplete && onChangeComplete(hex)
    }


    return (
        <RcColorPicker
            value={color}
            panelRender={(panel) => {
                return (
                    <>
                        {panel}
                        <Input
                            value={color}
                            onBlur={(e) => handleChangeComplete(e.target.value)}
                            onChange={(e) => handleChange(e.target.value)}
                        />
                        <Separator className={'my-2'}/>
                        <div className={'flex flex-wrap gap-2'}>
                            {
                                presetColors.current.map((c, index) => (
                                    <ColorBox color={c} key={index} onClick={handleChangeComplete}/>
                                ))
                            }
                        </div>
                    </>
                )
            }}
            onChangeComplete={handleChangeComplete}
            onChange={handleChange}
        />
    )
}