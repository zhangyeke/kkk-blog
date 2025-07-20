import {parseUrlQuery} from "@/lib/utils"
import {withResponseHandler} from "@/lib/withResponseHandler";
import {fetchPhotoWall, fetchVideoMaterial} from "@/service/Material";

export const GET = withResponseHandler(async (request) => {
    const {materialType, ...params} = parseUrlQuery(request.url)
    if (materialType) {
        return await fetchVideoMaterial(params)
    } else {
        return await fetchPhotoWall(params)
    }
})
