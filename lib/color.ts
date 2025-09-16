import chroma from 'chroma-js';
import {uniq} from 'lodash';

export function rgb2hex(color: string) {
    return chroma(color).hex() as string
}

// 颜色16进制转 rgb
export function hex2rgb(color: string, opacity: number = 1) {
    return `rgba(${chroma(color).alpha(opacity).rgba().join()})`
}

/*
 * @Author: EDY
 * @Date: 2025/9/16
 * @LastEditors: EDY
 * @Description: 颜色转为暗色
 * @Params:{
 *color:颜色值
 *dark：亮度0-1  每个值代表10%
 * }
 */
export function color2dark(color: string, dark = 0.2) {
    return chroma(color).set('hsl.l', dark).hex()
}


export const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;

// 创建主题颜色色阶
export function createColorArr(
    mainColor: string,
    options?: { light: number; dark: number; maxLength: number }
) {
    const {light, maxLength, dark} = {
        light: 0.85,
        dark: 0.2,
        maxLength: 10,
        ...options,
    };
    // 生成 5 个色阶，色阶由主色逐渐变浅
    const shallows = chroma
        .scale([mainColor, chroma(mainColor).set('hsl.l', light)])
        .mode('lab')
        .colors(maxLength / 2 + 1)
        .reverse();

    // 生成 5 个色阶，从主色逐渐变深
    const deeps = chroma
        .scale([mainColor, chroma(mainColor).set('hsl.l', dark)])
        .mode('lab')
        .colors(maxLength / 2);

    return uniq([...shallows, ...deeps]).map((color) => chroma(color).oklch(2));
}

// 在:root注册属性
export const rootRegisterProperty = (key: string, value: string) => {
    const rootElement = document.documentElement;
    rootElement.style.setProperty(key, value);
}
