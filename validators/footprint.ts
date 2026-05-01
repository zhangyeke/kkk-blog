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
      // description:"",//用于在输入框下方添加提示信息
      // order: -1,//排序
      inputProps: {
        placeholder: "请选择足迹地区",
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
})

