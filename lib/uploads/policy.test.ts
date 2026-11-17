/** @jest-environment node */
import { imageFileExtension, imageUploadLimitBytes } from "./policy"

test.each([
  ["3mb", 3 * 1024 ** 2],
  ["3", 3 * 1024 ** 2],
  ["0.5 MB", 512 * 1024],
  ["512kb", 512 * 1024],
  ["100b", 100],
])("parses the file limit %s consistently", (value, expected) => {
  expect(imageUploadLimitBytes(value as string)).toBe(expected)
})
test.each(["", "-1mb", "0mb", "abc", "Infinity", "3mb garbage"])("rejects invalid limits %s", (value) => {
  expect(() => imageUploadLimitBytes(value)).toThrow()
})
test.each([
  [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "png"],
  [[0xff, 0xd8, 0xff], "jpg"],
  [Array.from("GIF89a", (c) => c.charCodeAt(0)), "gif"],
  [Array.from("RIFF1234WEBP", (c) => c.charCodeAt(0)), "webp"],
  [[0x42, 0x4d], "bmp"],
  [[0, 0, 1, 0], "ico"],
  [Array.from("0000ftypheic0000heic", (c) => c.charCodeAt(0)), "heic"],
] as const)("recognizes supported image signatures", (header, expected) => {
  expect(imageFileExtension(new Uint8Array(header))).toBe(expected)
})
test("rejects plain text and truncated input", () => {
  expect(imageFileExtension(new Uint8Array())).toBeNull()
  expect(imageFileExtension(new TextEncoder().encode("not an image"))).toBeNull()
})
