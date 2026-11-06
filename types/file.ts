export interface UploadedImage {
  url: string
}

export type UploadImageResult = BaseResource<UploadedImage | null>
