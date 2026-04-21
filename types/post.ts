import {z} from "zod";
import {addPostSchema} from "@/validators/post";
import {Prisma} from "@prisma/client";

export type addPostParams = z.infer<typeof addPostSchema>

export const postWithUserInclude = {
    category: true,
    user: {
        select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
        }
    }
}

// 1. 定义查询参数的类型，确保它与你 findMany 里的 include 逻辑一致
export type PostWithUser = Prisma.PostGetPayload<{
    include: typeof postWithUserInclude
}> & { summary?: string }