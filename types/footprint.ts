import {z} from "zod"
import {addFootprintSchema, updateFootprintSchema} from "@/validators/footprint"

export type {Footprint} from "@prisma/client"

export type addFootprintParams = z.infer<typeof addFootprintSchema>
export type updateFootprintParams = z.infer<typeof updateFootprintSchema>
