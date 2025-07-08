import {Inter, Roboto_Mono} from 'next/font/google'
import localFont from 'next/font/local'

// 加载本地字体
const globalFont = localFont({
    src: [
        {
            path: './Sara1170470173201689.woff2',
            weight: '400',
            style: 'normal',
        },

    ],
    variable: "--global-font"
});

const h1Font = localFont({
    src: [
        {
            path: './DripOctober-vm0JA.ttf',
            weight: '400',
            style: 'normal',
        },
    ],
    variable: "--h1-font"
});


// 加载 Google 字体
// const inter = Inter({
//     subsets: ['latin'],
//     display: 'swap',
// })


export {globalFont, h1Font}