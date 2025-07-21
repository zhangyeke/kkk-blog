import {z} from "zod"

export const postCategorySchema  = z.object({
    id: z.number(),
    name: z.string(),
    created_at: z.date()
})

export type PostCategory = z.infer<typeof postCategorySchema>
