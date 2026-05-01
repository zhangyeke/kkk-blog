/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 23:01:08
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 00:20:31
 * @FilePath: \blog\app\blog\@footer\default.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React from "react"
import Squares from '@/components/bits/Squares';
import {useAppStore} from "@/hooks";
import {hex2rgb} from "@/lib/color";


export default function Default() {
    const {themes} = useAppStore(state => state)
    return (
        <footer
            className={'w-full relative rounded-tr-[24px] rounded-tl-[24px] overflow-hidden shadow-lg shadow-gray-500'}>
            <Squares
                speed={0.2}
                squareSize={40}
                direction='diagonal' // up, down, left, right, diagonal
                borderColor={hex2rgb(themes.primary, 0.2)}
                hoverFillColor={themes.primary}
                bgColor={hex2rgb(themes.primary, 0.1)}
            />
            <div className={'text-sm lg:text-base absolute position-center w-full text-center  select-none pointer-events-none'}>
                <p> 本网站部分内容来源于网络，仅供大家学习与参考。 </p>
                <p>本网站一切内容不代表本站立场，并不代表本站赞同其观点和对其真实性负责。</p>
                <p>如无意中侵犯了某个企业或个人的知识产权，请及时通过电子邮件(997610780@qq.com)告知我，本网站将立即给予删除。</p>
            </div>
        </footer>
    )
}
