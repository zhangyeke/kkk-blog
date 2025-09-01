import {z} from "zod"
import {loginSchema, registerSchema} from "@/validators/auth"


export type LoginParams = z.infer<typeof loginSchema>

export type RegisterParams = z.infer<typeof registerSchema>
