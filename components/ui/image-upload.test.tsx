import { render, screen } from "@testing-library/react"
import { ImageUpload } from "./image-upload"

jest.mock("@/env.mjs", () => ({ env: { NEXT_PUBLIC_IMG_UPLOAD_LIMIT: "3mb" } }))
// lib/utils 会经 service/fileUpload 拉入 "use server" 链路（next-auth 等），jsdom 里必须切断
jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))
jest.mock("@/components/k-view/Image", () => ({ Image: () => null }))
jest.mock("@/hooks/use-image-upload", () => ({
  useImageUpload: () => ({
    pending: false,
    previewUrl: "",
    fileName: null,
    fileInputRef: { current: null },
    handleThumbnailClick: jest.fn(),
    handleFileChange: jest.fn(),
    handleRemove: jest.fn(),
  }),
}))

test("shows the upload route selector by default", () => {
  render(<ImageUpload />)
  expect(screen.getByRole("combobox", { name: "上传线路" })).toBeInTheDocument()
})

test("can hide the route selector", () => {
  render(<ImageUpload showRouteSelect={false} />)
  expect(screen.queryByRole("combobox", { name: "上传线路" })).toBeNull()
})
