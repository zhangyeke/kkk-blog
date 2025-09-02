import {z} from "zod"

export const postCategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    status: z.number(),
    icon: z.string().optional().nullable(),
    createdAt: z.date()
})

export type PostCategory = z.infer<typeof postCategorySchema>
