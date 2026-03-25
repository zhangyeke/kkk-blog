"use client"
import dynamic from 'next/dynamic'
import React, {ReactNode} from "react"
import {ControllerRenderProps, FieldValues, Path} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Spinner} from "../Loader"
// 1. 动态引入，禁用 SSR
const Editor = dynamic(() => import('@/components/k-view/MarkedEditor'), {
    ssr: false,
    loading: () => <Spinner text={'编辑器加载中...'}/>
})

// 定义一个基础属性类型，合并 hook-form 的 field 属性
type BaseControlAttrs<TFieldValues extends FieldValues = FieldValues> = Partial<ControllerRenderProps<TFieldValues, Path<TFieldValues>>>


export interface ControlProps<T extends FieldValues = FieldValues> {
    type?: 'input' | 'markdown' | ReactNode;
    // 这里的 value 会根据传入的泛型自动推导
    attrs: BaseControlAttrs<T>;
}

export function Control<T extends FieldValues>(props: ControlProps<T>) {
    const {type = 'input', attrs} = props;
    const controlAttrs = {
        ...attrs,
        value: attrs.value ?? "",
    }
    switch (type) {
        case 'input': {
            return <Input {...controlAttrs}/>
        }
        case 'markdown': {
            return <Editor {...controlAttrs}/>
        }
        default: {
            return type
        }
    }
}
