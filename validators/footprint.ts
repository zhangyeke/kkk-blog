/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 22:20:53
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-30 13:56:28
 * @FilePath: \blog\validators\footprint.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { z } from "zod"
import { fieldConfig } from "@autoform/zod"

/** 新增足迹 */
export const addFootprintSchema = z.object({
  regionCode: z.array(z.string().nonempty("请选择足迹地区")).superRefine(
    fieldConfig({
      label: "足迹地区",
      fieldType: "regionCascader",
      inputProps: {
        placeholder: "请选择足迹地区",
        allowParentSelection: true,
        minParentSelectionDepth: 2,
      },
    })
  ),

  address: z
    .string()
    .max(500, "地址长度不能超过 500 字")
    .optional()
    .superRefine(
      fieldConfig({
        label: "详细地址",
        fieldType: "textarea",
        inputProps: {
          placeholder: "选填，填写详细地址",
        },
      })
    ),
  coordinates: z
    .object({
      lng: z.string().trim(),
      lat: z.string().trim(),
    })
    .optional()
    .superRefine(
      fieldConfig({
        label: "经纬度",
        description: "填写详细地点并选择地区后，可通过高德地图获取坐标",
        fieldType: "geoCoordinates",
      })
    ),
  album: z.array(z.string().url("请上传正确的图片地址")).superRefine(
    fieldConfig({
      label: "图集",
      description: "图片资源链接列表",
      fieldType: "uploadFiles",
      inputProps: {
        placeholder: "请上传或填写图片",
        accept: "image/*",
      },
    })
  ),
}).superRefine((values, ctx) => {
  const longitude = values.coordinates?.lng ?? ""
  const latitude = values.coordinates?.lat ?? ""

  if (!longitude && !latitude) return

  if (!longitude || !latitude) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coordinates"],
      message: "经度和纬度需要同时填写",
    })
    return
  }

  const lng = Number(longitude)
  const lat = Number(latitude)
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coordinates"],
      message: "经度范围应为 -180 至 180",
    })
  }
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["coordinates"],
      message: "纬度范围应为 -90 至 90",
    })
  }
})

