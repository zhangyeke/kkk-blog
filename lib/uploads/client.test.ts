/** @jest-environment node */
import { uploadImagePromise } from "./client"
import { uploadImage } from "@/service/fileUpload"
import { toast } from "sonner"
import { env } from "@/env.mjs"

jest.mock("@/service/fileUpload", () => ({ uploadImage: jest.fn() }))
jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }))
jest.mock("@/env.mjs", () => ({ env: { NEXT_PUBLIC_IMG_UPLOAD_LIMIT: "3mb" } }))

beforeEach(() => {
  jest.clearAllMocks()
  ;(env as { NEXT_PUBLIC_IMG_UPLOAD_LIMIT: string }).NEXT_PUBLIC_IMG_UPLOAD_LIMIT = "3mb"
  jest
    .mocked(uploadImage)
    .mockResolvedValue({ code: 200, message: "ok", data: { url: "https://images.example/a.png" } })
})

test("keeps the common client entry returning only the image URL", async () => {
  const file = new File(["test"], "image.png")
  await expect(uploadImagePromise(file)).resolves.toBe("https://images.example/a.png")
  const params = jest.mocked(uploadImage).mock.calls[0]![0]
  expect(params.get("file")).toBeInstanceOf(File)
  expect(params.get("params")).toBeNull()
})

test("shows and rejects a serialized provider failure", async () => {
  jest.mocked(uploadImage).mockResolvedValueOnce({ code: 502, message: "图床拒绝了上传请求（403）", data: null })
  await expect(uploadImagePromise(new File(["test"], "a.png"))).rejects.toThrow("403")
  expect(toast.error).toHaveBeenCalledTimes(1)
})

test("lets the editor handle its own error notification", async () => {
  jest.mocked(uploadImage).mockResolvedValueOnce({ code: 504, message: "图片上传超时", data: null })
  await expect(uploadImagePromise(new File(["test"], "a.png"), false)).rejects.toThrow("超时")
  expect(toast.error).not.toHaveBeenCalled()
})

test("uses the configured size unit before making a server request", async () => {
  ;(env as { NEXT_PUBLIC_IMG_UPLOAD_LIMIT: string }).NEXT_PUBLIC_IMG_UPLOAD_LIMIT = "2b"
  await expect(uploadImagePromise(new File(["123"], "a.png"))).rejects.toThrow("超过限制")
  expect(uploadImage).not.toHaveBeenCalled()
})

test("rejects success responses that have no image URL", async () => {
  jest.mocked(uploadImage).mockResolvedValueOnce({ code: 200, message: "图片地址缺失", data: { url: "" } })
  await expect(uploadImagePromise(new File(["test"], "a.png"))).rejects.toThrow("图片地址缺失")
})
