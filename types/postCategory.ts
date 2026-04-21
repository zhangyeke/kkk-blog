import {z} from "zod"
import {Prisma} from "@prisma/client";
import {postWithUserInclude} from "@/types/post";

export type {PostCategory} from '@prisma/client'

export const postCategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    status: z.number(),
    icon: z.string().optional().nullable(),
    createdAt: z.date()
})

/*文章分类关联旗下文章列表*/
export type PostCategoryWithPosts = Prisma.PostCategoryGetPayload<{
    include: {
        posts: {
            include: typeof postWithUserInclude
        }
    },
}>;