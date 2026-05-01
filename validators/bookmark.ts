/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-29 19:45:17
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 20:03:30
 * @FilePath: \blog\validators\bookmark.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { z } from "zod"
import { fieldConfig } from "@autoform/zod"
import { getBookmarkCategoryList } from "@/service/bookmarkCategory"
export const addBookmarkSchema = z.object({
  title: z
    .string()
    .nonempty("书签标题不能为空")
    .max(100, "书签标题长度不能超过100位")
    .superRefine(
      fieldConfig({
        label: "书签标题",
        // description:"请输入标题",//用于在输入框下方添加提示信息
        // order: -1,//排序
        inputProps: {
          placeholder: "请输入书签标题",
        },
      })
    ),
  categoryId: z.number({ message: "请选择书签分类" }).superRefine(
    fieldConfig({
      label: "书签分类",
      fieldType: "remoteSelect",
      inputProps: {
        placeholder: "请选择书签分类",
        api: getBookmarkCategoryList,
        labelKey: "name",
        valueKey: "id",
      },
    })
  ),
  url: z
    .string()
    .url("书签链接必须是一个有效的URL地址")
    .superRefine(
      fieldConfig({
        label: "书签链接",
        inputProps: {
          placeholder: "请输入书签链接",
        },
      })
    ),
  intro: z
    .string()
    .optional()
    .superRefine(
      fieldConfig({
        label: "描述",
        description: "描述",
        fieldType: "textarea",
        inputProps: {
          placeholder: "请输入描述",
        },
      })
    ),
    icon: z.string().optional().superRefine(
      fieldConfig({
          label: "书签图标",
          fieldType: "imageUpload",
          inputProps: {
              placeholder: '请上传书签图标',
          }
      })
  ),
})

export const addBookmarkCategorySchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100),
  status: z.coerce.number().int().min(0).max(1).optional(),
})
