/** Shared by the client precheck and the authoritative server validation. */
export function imageUploadLimitBytes(value: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(b|kb|kib|mb|mib|gb|gib)?$/i.exec(value.trim())
  if (!match) throw new Error("图片上传大小限制配置无效，请联系管理员")
  const unit = (match[2] || "mb").toLowerCase()
  const multiplier = { b: 1, kb: 1024, kib: 1024, mb: 1024 ** 2, mib: 1024 ** 2, gb: 1024 ** 3, gib: 1024 ** 3 }[unit]!
  const bytes = Number(match[1]) * multiplier
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error("图片上传大小限制配置无效，请联系管理员")
  return bytes
}

export type ImageFileExtension = "png" | "jpg" | "gif" | "webp" | "bmp" | "ico" | "heic"

/** Recognize supported binary image signatures rather than trusting the browser MIME type. */
export function imageFileExtension(header: Uint8Array): ImageFileExtension | null {
  const starts = (...bytes: number[]) => bytes.every((byte, index) => header[index] === byte)
  const ascii = (start: number, end: number) => String.fromCharCode(...header.slice(start, end))
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png"
  if (starts(0xff, 0xd8, 0xff)) return "jpg"
  if (["GIF87a", "GIF89a"].includes(ascii(0, 6))) return "gif"
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp"
  if (starts(0x42, 0x4d)) return "bmp"
  if (starts(0x00, 0x00, 0x01, 0x00)) return "ico"
  if (ascii(4, 8) === "ftyp" && /heic|heix|hevc|hevx/.test(ascii(8, 32))) return "heic"
  return null
}
