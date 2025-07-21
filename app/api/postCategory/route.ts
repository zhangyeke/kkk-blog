import {withResponseHandler} from "@/lib/withResponseHandler";
import {getAllPostCategory} from "@/service/PostCategory";

export const GET = withResponseHandler(getAllPostCategory)