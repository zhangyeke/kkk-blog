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
import { StringField } from "./StringField"
import { SelectField } from "./SelectField"
import { TextareaField } from "./TextareaField"
import { ImageUploadField } from "./ImageUploadField"
import { RemoteSelect } from "./RemoteSelectField"
import { MarkedField } from "./MarkedField"
import { NumberField } from "./NumberField"
import UploadFileField from "./UploadFileField"
import { RegionCascaderField } from "./RegionCascader"
import type { CustomControlProps } from "../type"
import { IconPickerField } from "./IconPickerField"
import { SegmentedControl } from "./SegmentedControl"
import { GeoCoordinatesField } from "./GeoCoordinatesField"
export const FieldComponents = {
  string: StringField,
  select: SelectField,
  number: NumberField,
  // boolean: BooleanField,
  // date: DateField,
  textarea: TextareaField,
  uploadFiles: UploadFileField,
  imageUpload: ImageUploadField,
  remoteSelect: RemoteSelect,
  markdown: MarkedField,
  regionCascader: RegionCascaderField,
  iconPicker: IconPickerField,
  statusSegment: SegmentedControl,
  geoCoordinates: GeoCoordinatesField,
} as const

export type FieldComponentsType = keyof typeof FieldComponents

export type ControlProps = {
  type: FieldComponentsType | string
  attrs: CustomControlProps
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  formComponents?: {
    [key: string]: (props: CustomControlProps) => React.ReactNode
  }
}

export function Control({
  type,
  attrs,
  formComponents,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: ControlProps) {
  const allComponent = {
    ...FieldComponents,
    ...formComponents,
  }
  const Component = allComponent[type]
  if (!Component) return null

  return <Component {...attrs} id={id} aria-describedby={describedBy} aria-invalid={invalid} />
}
