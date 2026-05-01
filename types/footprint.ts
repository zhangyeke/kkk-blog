/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 22:20:53
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-02 00:02:10
 * @FilePath: \blog\types\footprint.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {z} from "zod"
import {addFootprintSchema} from "@/validators/footprint"

export type {Footprint} from "@prisma/client"

export type addFootprintParams = z.infer<typeof addFootprintSchema>
