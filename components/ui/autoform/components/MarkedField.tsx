import React from "react";
import dynamic from "next/dynamic";
import {AutoFormFieldProps} from "@autoform/react";
import {Skeleton} from "@/components/ui/skeleton"


// 1. 动态引入，禁用 SSR
const Editor = dynamic(() => import('@/components/k-view/MarkedEditor'), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-100"/>
})


export const MarkedField = ({inputProps, value, ...props}: AutoFormFieldProps) => {
    const {placeholder, name, onChange} = inputProps

    return (
        <Editor
            value={value}
            placeholder={placeholder}
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
