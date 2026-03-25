import {z} from "zod"

export {type PostCategory,Prisma} from '@prisma/client'
export const postCategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    status: z.number(),
    icon: z.string().optional().nullable(),
    createdAt: z.date()
})

