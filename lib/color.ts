

// 颜色16进制转 rgb
export function hex2rgb(hex: string, opacity: number = 1) {
    const rgba =
        "rgba(" +
        parseInt("0x" + hex.slice(1, 3)) +
        "," +
        parseInt("0x" + hex.slice(3, 5)) +
        "," +
        parseInt("0x" + hex.slice(5, 7)) +
        "," +
        (opacity || "1") +
        ")";
    return rgba;
}

// rgb 转 16进制颜色
export function rgb2hex(color: string) {
    const values = color
        .replace(/rgba?\(/, "")
        .replace(/\)/, "")
        .replace(/[\s+]/g, "")
        .split(",");
    const a = parseFloat(values[3] || "1"),
        r = Math.floor(a * parseInt(values[0]) + (1 - a) * 255),
        g = Math.floor(a * parseInt(values[1]) + (1 - a) * 255),
        b = Math.floor(a * parseInt(values[2]) + (1 - a) * 255);
    return (
        "#" +
        ("0" + r.toString(16)).slice(-2) +
        ("0" + g.toString(16)).slice(-2) +
        ("0" + b.toString(16)).slice(-2)
    );
}



// 根据主题色创建夜间模式相应颜色
export const createDarkColor = (primaryColor = "#1677ff", defaultBgColor = "#141414", cssVar = true) => {
    const colors = []
    if (cssVar) {
        colors.forEach((color, index) => {
            registerProperty(`--dark-primary-${index + 1}`, color)
        })
    }
    return colors;
}

// 在:root注册属性
export const registerProperty = (key: string, value: string) => {
    const rootElement = document.documentElement;
    rootElement.style.setProperty(key, value);
}

export const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/;

// 是否为颜色值
export function isColor(str: string): boolean {
    // 十六进制颜色值
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const hexWithAlphaRegex = /^#([A-Fa-f0-9]{8})$/;

    // RGB 颜色值
    const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

    // 英文颜色名称
    const colorNames = [
        'black', 'silver', 'gray', 'white', 'maroon', 'red', 'purple', 'fuchsia', 'green', 'lime', 'olive',
        'yellow', 'navy', 'blue', 'teal', 'aqua', 'aliceblue', /* 其他颜色名称 */
    ];

    return hexRegex.test(str)
        || hexWithAlphaRegex.test(str)
        || rgbRegex.test(str)
        || rgbaRegex.test(str)
        || colorNames.includes(str.toLowerCase());
}