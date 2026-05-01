/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2025-10-22 18:12:45
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-28 14:48:46
 * @FilePath: \blog\components\k-view\Form\components\Control.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import React from "react"
import {StringField} from "./StringField";
import {TextareaField} from "./TextareaField";
import {ImageUploadField} from "./ImageUploadField";
import {RemoteSelect} from "./RemoteSelectField";
import {MarkedField} from "./MarkedField";
import {NumberField} from "./NumberField";
import UploadFileField from "./UploadFileField";
import {RegionCascaderField} from "./RegionCascader";
import {CustomControlProps} from "../type";

export const FieldComponents = {
    string: StringField,
    number: NumberField,
    // boolean: BooleanField,
    // date: DateField,
    // select: SelectField,
    textarea: TextareaField,
    uploadFiles: UploadFileField,
    imageUpload: ImageUploadField,
    remoteSelect: RemoteSelect,
    markdown: MarkedField,
    regionCascader: RegionCascaderField
} as const

export type FieldComponentsType = keyof typeof FieldComponents


export type ControlProps = {
    type: FieldComponentsType | string,
    attrs: CustomControlProps
    formComponents?: {
        [key: string]: (props: CustomControlProps) => React.ReactNode
    }
}

export function Control({type, attrs, formComponents}: ControlProps) {
    const allComponent = {
        ...FieldComponents,
        ...formComponents
    }
    const Component = allComponent[type];
    if (!Component) return null

    return <Component {...attrs} />;
}
