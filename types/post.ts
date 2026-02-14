import {z} from "zod";
import {addPostSchema} from "@/validators/post";

export type addPostParams = z.infer<typeof addPostSchema>