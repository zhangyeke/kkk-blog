export interface UploadImageResponse {
    code?: number,
    msg?: 'success',
    data?: {
        imgid: string,
        path:string,
        url: string,
        thumbnail_url:string,
        width: number,
        height: number,
        filename: string,
        size: number
    }
}