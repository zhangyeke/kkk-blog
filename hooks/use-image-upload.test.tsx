import { act, renderHook, waitFor } from "@testing-library/react"
import { useImageUpload } from "./use-image-upload"
import { uploadImagePromise } from "@/lib/uploads/client"

jest.mock("@/lib/uploads/client", () => ({ uploadImagePromise: jest.fn() }))

test("a failed upload clears pending state and preserves the previous picture", async () => {
  jest.mocked(uploadImagePromise).mockRejectedValueOnce(new Error("provider unavailable"))
  const onUpload = jest.fn()
  const { result } = renderHook(() => useImageUpload({ value: "https://images.example/old.png", onUpload }))
  const input = document.createElement("input")
  input.type = "file"
  result.current.fileInputRef.current = input
  act(() => result.current.handleFileChange({ target: { files: [new File(["test"], "a.png")] } }))
  await waitFor(() => expect(result.current.pending).toBe(false))
  expect(result.current.previewUrl).toBe("https://images.example/old.png")
  expect(onUpload).not.toHaveBeenCalled()
  expect(input.value).toBe("")
})
