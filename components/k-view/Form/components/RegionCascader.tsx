/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-28 00:51:43
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-28 00:54:11
 * @FilePath: \blog\components\k-view\Form\components\RegionCascader.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import React from "react";
import {RegionCascader} from "@/components/k-view/RegionCascader"
import {CustomControlProps} from "../type";


export const RegionCascaderField = ({onChange, name, ...props}: CustomControlProps) => {

    return (
        <RegionCascader
            getOptionValue={(o) => o.id}
            getOptionLabel={(o) => o.name}
            {...props}
            onChange={(v) => {
                onChange({
                    target: {
                        name,
                        value: v
                    }
                })
            }}
        />
    )
};
