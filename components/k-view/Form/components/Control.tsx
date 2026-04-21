"use client"
import React from "react"
import {StringField} from "./StringField";
import {TextareaField} from "./TextareaField";
import {ImageUploadField} from "./ImageUploadField";
import {RemoteSelect} from "./RemoteSelectField";
import {MarkedField} from "./MarkedField";
import {NumberField} from "./NumberField";
import UploadFileField from "./UploadFileField";
import {CustomControlProps} from "../type";
import {AutoFormFieldComponents} from "@autoform/react";

export const FieldComponents = {
    string: StringField,
    number: NumberField,
    // boolean: BooleanField,
    // date: DateField,
    // select: SelectField,
    textarea: TextareaField,
    // uploadFile: UploadFileField,
    imageUpload: ImageUploadField,
    remoteSelect: RemoteSelect,
    markdown: MarkedField,
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
